<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import Pagination from "$lib/components/Table/Pagination.svelte";
  import { mode } from "mode-watcher";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import { onMount } from "svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import { formatDate } from "$lib/utils";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
  news_flow_breadcrumb_home,
  news_flow_breadcrumb_news_flow,
  news_flow_infobox,
  news_flow_main_title,
  news_flow_news_count,
  news_flow_no_news,
  news_flow_search_placeholder,
  news_flow_seo_description,
  news_flow_seo_keywords,
  news_flow_seo_title,
  news_flow_sidebar_dark_pool_description,
  news_flow_sidebar_dark_pool_title,
  news_flow_sidebar_market_flow_description,
  news_flow_sidebar_market_flow_title,
  news_flow_sidebar_options_flow_description,
  news_flow_sidebar_options_flow_title,
  news_flow_structured_description,
  news_flow_structured_name,
} from "$lib/paraglide/messages";

  export let data;

  let rawData = data?.getData?.output;
  let originalData = data?.getData?.output;
  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;
  let stockList = [];

  let inputValue = "";
  let searchWorker: Worker | undefined;

  // Function to update paginated data
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    stockList = rawData?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((rawData?.length || 0) / rowsPerPage);
  }

  // Handle page change event from Pagination component
  function handlePageChange(event) {
    currentPage = event.detail.page;
    updatePaginatedData();
  }

  // Handle rows per page change event from Pagination component
  function handleRowsPerPageChange(event) {
    rowsPerPage = event.detail.rowsPerPage;
    currentPage = 1; // Reset to first page when changing rows per page
    updatePaginatedData();
  }

  async function resetTableSearch() {
    inputValue = "";
    rawData = originalData;
    currentPage = 1; // Reset to first page
    updatePaginatedData();
  }

  async function search() {
    inputValue = inputValue?.toLowerCase();

    setTimeout(async () => {
      if (inputValue?.length > 0) {
        await loadSearchWorker();
      } else {
        // Reset to original data if filter is empty
        rawData = originalData;
        currentPage = 1; // Reset to first page
        updatePaginatedData();
      }
    }, 100);
  }

  const loadSearchWorker = async () => {
    if (searchWorker && originalData?.length > 0) {
      searchWorker.postMessage({
        rawData: originalData,
        inputValue: inputValue,
      });
    }
  };

  const handleSearchMessage = (event) => {
    if (event.data?.message === "success") {
      rawData = event.data?.output ?? [];
      currentPage = 1; // Reset to first page after search
      updatePaginatedData();
    }
  };

  onMount(async () => {
    // Initialize pagination
    updatePaginatedData();

    if (!searchWorker) {
      const SearchWorker = await import(
        "$lib/workers/tableSearchWorker?worker"
      );
      searchWorker = new SearchWorker.default();
      searchWorker.onmessage = handleSearchMessage;
    }
  });
</script>

<SEO
  title={news_flow_seo_title()}
  description={news_flow_seo_description()}
  keywords={news_flow_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: news_flow_structured_name(),
    description: news_flow_structured_description(),
    url: "https://stocknear.com/news-flow",
    applicationCategory: "FinanceApplication",
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
          name: "News Flow",
          item: "https://stocknear.com/news-flow",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
  >
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >{news_flow_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-800 dark:text-zinc-300">{news_flow_breadcrumb_news_flow()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-5">
          <div class="mb-3">
            <h1
              class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {news_flow_main_title()}
            </h1>
          </div>

          <Infobox
            text={news_flow_infobox()}
          />

          <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
            <div
              class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
            >
              <h2
                class="text-start whitespace-nowrap text-lg sm:text-xl font-semibold text-gray-900 dark:text-white py-1 border-b border-gray-300 dark:border-zinc-700 lg:border-none w-full"
              >
                {news_flow_news_count({ count: data?.getData?.totalItems?.toLocaleString("en-US") })}
              </h2>

              <div
                class="mt-1 w-full flex flex-row lg:flex order-1 items-center ml-auto pb-1 pt-1 sm:pt-0 w-full order-0 lg:order-1"
              >
                <div class="relative lg:ml-auto w-full lg:w-fit">
                  <div
                    class="inline-block cursor-pointer absolute right-2 top-2 text-sm"
                  >
                    {#if inputValue?.length > 0}
                      <label
                        class="cursor-pointer"
                        on:click={() => resetTableSearch()}
                      >
                        <svg
                          class="w-5 h-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          ><path
                            fill="currentColor"
                            d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                          /></svg>

                      </label>
                    {/if}
                  </div>

                  <input
                    bind:value={inputValue}
                    on:input={search}
                    type="text"
                    placeholder={news_flow_search_placeholder()}
                    class="py-[7px] text-[0.85rem] sm:text-sm border bg-white/80 dark:bg-zinc-950/60 border-gray-300 dark:border-zinc-700 rounded-full placeholder:text-gray-500 dark:placeholder:text-zinc-500 px-3 focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-zinc-700 grow w-full sm:min-w-56 lg:max-w-14"
                  />
                </div>

                <div class="ml-2">
                  <DownloadData {data} {rawData} title={"news_feed"} />
                </div>
              </div>
            </div>
          </div>

          {#if stockList?.length > 0}
            <table
              class="border-t border-gray-300 dark:border-zinc-700 text-sm mt-6 w-full"
            >
              <tbody>
                {#each stockList as item, index (item?.id ?? index)}
                  {@const list =
                    data?.user?.tier === "Pro"
                      ? stockList
                      : stockList?.slice(0, 5)}
                  {@const isPositive =
                    item?.text?.toLowerCase()?.includes("higher") &&
                    item?.changesPercentage > 0}
                  {@const isNegative =
                    item?.text?.toLowerCase()?.includes("lower") &&
                    item?.changesPercentage < 0}
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 transition-all duration-200 w-full
        {index === list.length - 1 && data?.user?.tier !== 'Pro'
                      ? 'opacity-10'
                      : ''}"
                    style="background: {(() => {
                      const baseColor =
                        $mode === 'light' ? '#ffffff' : '#09090B';

                      if ($mode === 'light') {
                        if (isPositive) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(34, 197, 94, 0.01) 50%, rgba(34, 197, 94, 0.05) 100%)`;
                        }
                        if (isNegative) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(238, 83, 101, 0.01) 50%, rgba(238, 83, 101, 0.05) 100%)`;
                        }
                      } else {
                        if (isPositive) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(0, 252, 80, 0.01) 50%, rgba(0, 252, 80, 0.1) 100%)`;
                        }
                        if (isNegative) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(238, 83, 101, 0.01) 50%, rgba(238, 83, 101, 0.1) 100%)`;
                        }
                      }
                      return baseColor;
                    })()}"
                  >
                    <td
                      class="hidden sm:inline-block pr-2 pt-3.5 align-top text-xs whitespace-nowrap font-medium text-gray-800 dark:text-zinc-300"
                    >
                      {formatDate(item?.date, true)}
                    </td>
                    <td class="py-3 pl-2 text-gray-700 dark:text-zinc-300">
                      <span
                        class="sm:hidden text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                        >{formatDate(item?.date, true)} ago -</span
                      >
                      {item?.text}

                      {#if item?.symbolList && item?.symbolList?.length > 0}
                        {#each item?.symbolList as symbol}
                          <a
                            href={`/${item?.assetType}/${symbol}`}
                            class="inline-flex items-center mr-1 mb-1 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:text-violet-400 transition sm:hover:text-muted dark:sm:hover:text-white"
                          >
                            {symbol}
                          </a>
                        {/each}
                      {:else if item?.symbol}
                        <a
                          href={`/${item?.assetType}/${item?.symbol}`}
                          class="inline-flex items-center mr-1 mb-1 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:text-violet-400 transition sm:hover:text-muted dark:sm:hover:text-white"
                        >
                          {item?.symbol}
                        </a>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <Infobox
              text={news_flow_no_news()}
            />
          {/if}

          <UpgradeToPro {data} display={true} />

          {#if stockList?.length > 0 && data?.user?.tier === "Pro"}
            <Pagination
              {currentPage}
              {totalPages}
              {rowsPerPage}
              {rowsPerPageOptions}
              on:pageChange={handlePageChange}
              on:rowsPerPageChange={handleRowsPerPageChange}
            />
          {/if}
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 ml-4">
          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/market-flow"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  {news_flow_sidebar_market_flow_title()}
                </h2>
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                {news_flow_sidebar_market_flow_description()}
              </span>
            </a>
          </div>

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/options-flow"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  {news_flow_sidebar_options_flow_title()}
                </h2>
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                {news_flow_sidebar_options_flow_description()}
              </span>
            </a>
          </div>
          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/unusual-order-flow"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  {news_flow_sidebar_dark_pool_title()}
                </h2>
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                {news_flow_sidebar_dark_pool_description()}
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

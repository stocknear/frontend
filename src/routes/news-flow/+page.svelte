<script lang="ts">
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import Pagination from "$lib/components/Table/Pagination.svelte";
  import { mode } from "mode-watcher";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import { onMount } from "svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import { formatDate } from "$lib/utils";

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
  title="Stock Market News Flow - Real-Time Financial News & Market Updates"
  description="Track real-time stock market news and understand why prices moved. Get instant access to breaking financial news, market updates, and stock price movements with detailed explanations. Free real-time news flow tracker."
  keywords="stock market news, financial news, market updates, stock news flow, real-time news, breaking news stocks, price movement news, market news tracker, stock alerts, financial updates"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Stock Market News Flow",
    description:
      "Real-time stock market news tracker with price movement explanations",
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
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">News Flow</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-5">
          <div class="mb-3">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">News Flow</h1>
          </div>

          <Infobox
            text="Track the latest breaking news and understand why stock prices moved in real-time"
          />

          <div class="items-center lg:overflow-visible px-1 py-1 mt-4">
            <div
              class="col-span-2 flex flex-col lg:flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-gray-800"
            >
              <h2
                class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold py-1 border-b border-gray-300 dark:border-gray-800 lg:border-none w-full"
              >
                {data?.getData?.totalItems?.toLocaleString("en-US")} News
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
                          /></svg
                        >
                      </label>
                    {/if}
                  </div>

                  <input
                    bind:value={inputValue}
                    on:input={search}
                    type="text"
                    placeholder="Find..."
                    class=" py-[7px] text-[0.85rem] sm:text-sm border bg-white dark:bg-default shadow focus:outline-hidden border border-gray-300 dark:border-gray-600 rounded placeholder:text-gray-800 dark:placeholder:text-gray-300 px-3 focus:outline-none focus:ring-0 dark:focus:border-gray-800 grow w-full sm:min-w-56 lg:max-w-14"
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
              class="border-t border-gray-300 dark:border-gray-800 text-sm sm:text-[1rem] mt-6 w-full"
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
                    class="border-b border-gray-300 dark:border-gray-800 transition-all duration-200 w-full
        {index === list.length - 1 && data?.user?.tier !== 'Pro'
                      ? 'opacity-10'
                      : ''}"
                    style="background: {(() => {
                      const baseColor =
                        $mode === 'light' ? '#ffffff' : '#09090B';

                      if ($mode === 'light') {
                        if (isPositive) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(34, 197, 94, 0.1) 50%, rgba(34, 197, 94, 0.13) 100%)`;
                        }
                        if (isNegative) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(238, 83, 101, 0.1) 50%, rgba(238, 83, 101, 0.13) 100%)`;
                        }
                      } else {
                        if (isPositive) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(0, 252, 80, 0.1) 50%, rgba(0, 252, 80, 0.16) 100%)`;
                        }
                        if (isNegative) {
                          return `linear-gradient(90deg, ${baseColor} 0%, rgba(238, 83, 101, 0.1) 50%, rgba(238, 83, 101, 0.16) 100%)`;
                        }
                      }
                      return baseColor;
                    })()}"
                  >
                    <td
                      class="hidden sm:inline-block pr-1 pt-2 align-top text-sm whitespace-nowrap font-bold"
                    >
                      {formatDate(item?.date, true)}
                    </td>
                    <td class="py-2 pl-2">
                      <span class="sm:hidden font-semibold"
                        >{formatDate(item?.date, true)} ago -</span
                      >
                      {item?.text}

                      {#if item?.symbolList && item?.symbolList?.length > 0}
                        {#each item?.symbolList as symbol}
                          <a
                            href={`/${item?.assetType}/${symbol}`}
                            class="inline-block rounded badge border border-gray-300 dark:border-gray-800 shadow duration-0 bg-blue-100 dark:bg-secondary font-semibold dark:font-normal rounded-sm ml-1 mb-1 px-2 m-auto text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted"
                          >
                            {symbol}
                          </a>
                        {/each}
                      {:else if item?.symbol}
                        <a
                          href={`/${item?.assetType}/${item?.symbol}`}
                          class="inline-block rounded badge border border-gray-300 dark:border-gray-800 shadow duration-0 bg-blue-100 dark:bg-secondary font-semibold dark:font-normal rounded-sm ml-1 mb-1 px-2 m-auto text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted"
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
              text="There are no major stock market news available yet."
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
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/market-flow"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">Market Flow</h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Track real-time options sentiment.
              </span>
            </a>
          </div>

          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/options-flow"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">Options Flow</h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Monitor real-time unusual options activity and flow patterns
              </span>
            </a>
          </div>
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/dark-pool-flow"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">
                  Dark Pool Flow
                </h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Analyze hidden institutional flow and dark pool trading data
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>

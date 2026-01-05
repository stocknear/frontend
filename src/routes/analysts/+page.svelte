<script lang="ts">
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import AnalystInfo from "$lib/components/AnalystInfo.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import Infobox from "$lib/components/Infobox.svelte";

  import SEO from "$lib/components/SEO.svelte";

  import { onMount } from "svelte";
  import { page } from "$app/stores";

  export let data;

  let rawData = data?.getTopAnalyst ?? [];
  let originalData = [...rawData]; // Unaltered copy of raw data
  let analystList = [];

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  let pagePathName = $page?.url?.pathname;

  function updatePaginatedData() {
    const totalItems = originalData?.length || 0;
    totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / rowsPerPage);
    const normalizedPage = Math.min(Math.max(currentPage, 1), totalPages || 1);
    if (normalizedPage !== currentPage) {
      currentPage = normalizedPage;
    }
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    analystList = originalData?.slice(startIndex, endIndex) ?? [];
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      updatePaginatedData();
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedData();
    saveRowsPerPage();
  }

  function saveRowsPerPage() {
    if (!pagePathName || typeof localStorage === "undefined") return;

    try {
      const paginationKey = `${pagePathName}_rowsPerPage`;
      localStorage.setItem(paginationKey, String(rowsPerPage));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  function loadRowsPerPage() {
    const currentPath = pagePathName || $page?.url?.pathname;

    if (!currentPath || typeof localStorage === "undefined") {
      rowsPerPage = 20;
      return;
    }

    try {
      const paginationKey = `${currentPath}_rowsPerPage`;
      const savedRows = localStorage.getItem(paginationKey);

      if (savedRows && rowsPerPageOptions.includes(Number(savedRows))) {
        rowsPerPage = Number(savedRows);
      } else {
        rowsPerPage = 20;
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
      rowsPerPage = 20;
    }
  }

  function scrollToTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  onMount(() => {
    loadRowsPerPage();
    updatePaginatedData();
  });

  // Reactive statement to load pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadRowsPerPage();
    updatePaginatedData();
  }

  let columns = [
    { key: "rank", label: "Rank", align: "left" },
    { key: "analystName", label: "Analyst", align: "left" },
    { key: "successRate", label: "Success Rate", align: "right" },
    { key: "avgReturn", label: "Avg. Return", align: "right" },
    { key: "totalRatings", label: "Total Ratings", align: "right" },
    { key: "lastRating", label: "Last Rating", align: "right" },
  ];

  let sortOrders = {
    rank: { order: "none", type: "number" },
    analystName: { order: "none", type: "string" },
    successRate: { order: "none", type: "number" },
    avgReturn: { order: "none", type: "number" },
    totalRatings: { order: "none", type: "number" },
    lastRating: { order: "none", type: "date" },
  };

  const sortData = (key) => {
    // Reset all other keys to 'none' except the current key
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k].order = "none";
      }
    }

    // Cycle through 'none', 'asc', 'desc' for the clicked key
    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(
      sortOrders[key]?.order || "none",
    );
    sortOrders[key] = {
      ...(sortOrders[key] || {}),
      order: orderCycle[(currentOrderIndex + 1) % orderCycle.length],
    };
    const sortOrder = sortOrders[key]?.order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      originalData = [...rawData]; // Reset originalData to rawData
      currentPage = 1;
      updatePaginatedData();
      return;
    }

    // Generic comparison function
    const compareValues = (a, b) => {
      const { type } = sortOrders[key];
      let valueA, valueB;

      switch (type) {
        case "date":
          valueA = new Date(a[key]);
          valueB = new Date(b[key]);
          break;
        case "rating":
        case "string":
          // Retrieve values
          valueA = a[key];
          valueB = b[key];

          // Handle null or undefined values, always placing them at the bottom
          if (valueA == null && valueB == null) {
            return 0; // Both are null/undefined, no need to change the order
          } else if (valueA == null) {
            return 1; // null goes to the bottom
          } else if (valueB == null) {
            return -1; // null goes to the bottom
          }

          // Convert the values to uppercase for case-insensitive comparison
          valueA = valueA?.toUpperCase();
          valueB = valueB?.toUpperCase();

          // Perform the sorting based on ascending or descending order
          return sortOrder === "asc"
            ? valueA?.localeCompare(valueB)
            : valueB?.localeCompare(valueA);
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

    // Sort and update the originalData and analystList
    originalData = [...rawData].sort(compareValues);
    currentPage = 1;
    updatePaginatedData();
  };
</script>

<SEO
  title="Analyst Rankings - Ratings That Move Stocks"
  description="Track top analyst rankings and recent rating changes to spot catalyst-driven moves and short-term trade setups."
  keywords="analyst rankings, analyst ratings, price target changes, upgrades downgrades, analyst catalysts, short-term trade setups"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Analyst Rankings",
    description:
      "Analyst rankings and rating performance for catalyst-driven trade ideas",
    url: "https://stocknear.com/analysts",
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
          name: "Analyst Rankings",
          item: "https://stocknear.com/analysts",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Wall Street Analyst Rankings",
      description: "Analyst performance rankings with recent rating catalysts",
      numberOfItems: rawData?.length || 0,
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-5 px-4 lg:px-3 mb-20 text-gray-700 dark:text-zinc-200"
>
  <div class="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-400">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
          >Home</a
        >
      </li>
      <li class="text-gray-500 dark:text-zinc-400">Top Wall Street Analysts</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5 mb-20">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Top Wall Street Analysts
            </h1>
            <p
              class="mb-3 px-1 text-sm text-gray-800 dark:text-zinc-300 sm:px-0"
            >
              A list of Wall Street Analysts, ranked by their performance
            </p>
          </div>

          <div class="w-full m-auto mt-10">
            {#if analystList?.length > 0}
              <div
                class="w-full m-auto rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mb-4 overflow-x-auto"
              >
                <table
                  class="table table-sm table-compact w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
                >
                  <thead>
                    <TableHeader {columns} {sortOrders} {sortData} />
                  </thead>
                  <tbody
                    class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                  >
                    {#each analystList as item, index}
                      <tr
                        class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50 {(currentPage -
                          1) *
                          rowsPerPage +
                          index +
                          1 ===
                          rawData?.length &&
                        !['Pro', 'Plus']?.includes(data?.user?.tier)
                          ? 'opacity-[0.1]'
                          : ''}"
                      >
                        <td class="text-[0.85rem] sm:text-sm text-center">
                          {item?.rank}
                        </td>

                        <td
                          class="text-start text-[0.85rem] sm:text-sm whitespace-nowrap"
                        >
                          <div class="flex flex-col items-start">
                            <a
                              href={"/analysts/" + item?.analystId}
                              class="font-semibold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400"
                              >{item?.analystName}
                            </a>
                            <!--<span class="">{item?.companyName} </span>-->
                            <div class="flex flex-row items-center mt-1">
                              {#each Array.from({ length: 5 }) as _, i}
                                {#if i < Math.floor(item?.analystScore)}
                                  <svg
                                    class="w-3.5 h-3.5 text-amber-400"
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
                                    class="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600"
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

                              <span
                                class="ml-1 text-gray-500 dark:text-zinc-400"
                              >
                                ({item?.analystScore !== null
                                  ? item?.analystScore
                                  : 0})
                              </span>
                            </div>
                          </div>
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap"
                        >
                          {#if Number(item?.successRate) >= 0}
                            <span
                              class="font-medium text-emerald-600 dark:text-emerald-400"
                              >+{Number(item?.successRate)?.toFixed(2)}%</span
                            >
                          {/if}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap"
                        >
                          {#if Number(item?.avgReturn) >= 0}
                            <span
                              class="font-medium text-emerald-600 dark:text-emerald-400"
                              >+{Number(item?.avgReturn)?.toFixed(2)}%</span
                            >
                          {:else}
                            <span
                              class="font-medium text-rose-600 dark:text-rose-400"
                              >{Number(item?.avgReturn)?.toFixed(2)}%</span
                            >
                          {/if}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap"
                        >
                          {item?.totalRatings}
                        </td>

                        <td
                          class="text-end text-[0.85rem] sm:text-sm whitespace-nowrap text-gray-600 dark:text-zinc-300"
                        >
                          {item?.lastRating !== null
                            ? new Date(item?.lastRating)?.toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  daySuffix: "2-digit",
                                },
                              )
                            : "n/a"}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else}
              <div class="w-full flex items-center justify-start text-start">
                <Infobox text="No analyst results found." />
              </div>
            {/if}

            {#if analystList?.length > 0}
              <div
                class="flex flex-row items-center justify-between mt-8 sm:mt-5"
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
                    <span class="hidden sm:inline">Previous</span></Button
                  >
                </div>

                <div class="flex flex-row items-center gap-4">
                  <span class="text-sm text-gray-600 dark:text-zinc-300">
                    Page {currentPage} of {totalPages}
                  </span>

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span class="truncate text-[0.85rem] sm:text-sm"
                          >{rowsPerPage} Rows</span
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
                        {#each rowsPerPageOptions as item}
                          <DropdownMenu.Item
                            class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                          >
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
                  class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
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
          </div>

          <UpgradeToPro {data} />

          <AnalystInfo />
        </main>
      </div>
    </div>
  </div>
</section>

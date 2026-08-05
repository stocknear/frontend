<script lang="ts">
  import { onDestroy } from "svelte";
  import { Combobox } from "bits-ui";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { abbreviateNumber } from "$lib/utils";
  import { localizedHref } from "$lib/i18n/navigation";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import Table from "$lib/components/Table/Table.svelte";
  import ExposurePie from "$lib/components/ETF/ExposurePie.svelte";
  import {
    EXPOSURE_DEFAULT_LIST,
    EXPOSURE_QUICK_FILTERS,
    EXPOSURE_SPECIFIC_ROWS,
    prepareExposureRows,
    summarize,
    type ExposureRow,
  } from "$lib/components/ETF/exposure";
  import {
    etf_reverse_lookup_breadcrumb_current,
    etf_reverse_lookup_breadcrumb_home,
    etf_reverse_lookup_empty,
    etf_reverse_lookup_empty_headline,
    etf_reverse_lookup_empty_hint,
    etf_reverse_lookup_examples_label,
    etf_reverse_lookup_heading,
    etf_reverse_lookup_infobox,
    etf_reverse_lookup_intro,
    etf_reverse_lookup_pie_toggle,
    etf_reverse_lookup_search_label,
    etf_reverse_lookup_search_no_matches,
    etf_reverse_lookup_search_placeholder,
    etf_reverse_lookup_search_start,
    etf_reverse_lookup_seo_description,
    etf_reverse_lookup_seo_keywords,
    etf_reverse_lookup_seo_title,
    etf_reverse_lookup_summary_aum,
    etf_reverse_lookup_summary_aum_info,
    etf_reverse_lookup_summary_avg_weight,
    etf_reverse_lookup_summary_avg_weight_info,
    etf_reverse_lookup_summary_exposure,
    etf_reverse_lookup_summary_exposure_info,
    etf_reverse_lookup_title,
    etf_reverse_lookup_unavailable,
  } from "$lib/paraglide/messages";

  export let data;

  const EXAMPLE_SYMBOLS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL"];

  let searchBarData = [];
  let inputValue = "";
  let touchedInput = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let searchAbortController: AbortController | null = null;
  let activeSearchRequestId = 0;

  $: symbol = data?.symbol ?? "";
  $: rows = prepareExposureRows((data?.getExposure ?? []) as ExposureRow[]);
  $: summary = summarize(rows);
  $: leaders = rows
    ?.slice(0, 3)
    ?.map((row) => `${row?.symbol} (${(row?.weightPercentage ?? 0)?.toFixed(2)}%)`)
    ?.join(", ");

  async function search() {
    if (timeoutId) clearTimeout(timeoutId);

    if (!inputValue?.trim()) {
      searchBarData = [];
      searchAbortController?.abort();
      searchAbortController = null;
      return;
    }

    const requestId = ++activeSearchRequestId;

    timeoutId = setTimeout(async () => {
      try {
        searchAbortController?.abort();
        searchAbortController = new AbortController();

        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=10&assetType=stocks`,
          { signal: searchAbortController.signal },
        );
        if (!response?.ok) throw new Error(`Search failed: ${response?.statusText}`);

        const searchOutput = await response.json();
        // A slower earlier keystroke must not overwrite newer results.
        if (requestId === activeSearchRequestId) searchBarData = searchOutput ?? [];
      } catch (error) {
        if (error instanceof DOMException && error?.name === "AbortError") return;
        console.error("Error during search:", error);
        searchBarData = [];
      }
    }, 250);
  }

  onDestroy(() => {
    // A pending debounce would otherwise fetch and assign state after unmount.
    if (timeoutId) clearTimeout(timeoutId);
    searchAbortController?.abort();
  });

  function changeTicker(nextSymbol?: string) {
    if (!nextSymbol || nextSymbol === symbol) return;
    searchBarData = [];
    // The URL is the whole state, so the view stays shareable and bookmarkable.
    goto(localizedHref(`/etf-reverse-lookup?symbol=${encodeURIComponent(nextSymbol)}`));
  }

  $: structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: etf_reverse_lookup_title(),
    url: `https://stocknear.com${$page?.url?.pathname ?? "/etf-reverse-lookup"}`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    description: etf_reverse_lookup_seo_description(),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: etf_reverse_lookup_breadcrumb_home(),
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: etf_reverse_lookup_breadcrumb_current(),
          item: "https://stocknear.com/etf-reverse-lookup",
        },
      ],
    },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
</script>

<SEO
  title={etf_reverse_lookup_seo_title()}
  description={etf_reverse_lookup_seo_description()}
  keywords={etf_reverse_lookup_seo_keywords()}
  {structuredData}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-fg"
>
  <BreadCrumb containerClass="text-xs sm:text-sm breadcrumbs text-fg">
    <li>
      <a
        href={localizedHref("/")}
        class="text-fg hover:text-accent"
        >{etf_reverse_lookup_breadcrumb_home()}</a
      >
    </li>
    <li class="text-fg">{etf_reverse_lookup_breadcrumb_current()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div class="relative flex justify-center items-start overflow-hidden w-full">
        <main class="w-full">
          <div class="mb-3 border-b border-line">
            <h1
              class="mb-1 type-h1 text-fg"
            >
              {etf_reverse_lookup_title()}
            </h1>
          </div>

          {#if symbol && rows?.length}
            <Infobox
              text={etf_reverse_lookup_infobox({
                symbol,
                count: summary?.fundCount,
                leaders,
              })}
            />
          {/if}

          <div class="mt-5 max-w-xl">
            <label
              for="etf-reverse-lookup-search"
              class="mb-1 block text-sm font-medium text-fg-muted"
            >
              {etf_reverse_lookup_search_label()}
            </label>
            <Combobox.Root
              items={searchBarData}
              bind:inputValue
              bind:touchedInput
              onSelectedChange={(next) => changeTicker(next?.value)}
            >
              <div class="relative w-full">
                <div class="absolute inset-y-0 left-0 flex items-center pl-2.5">
                  <svg
                    class="h-4 w-4 text-icon xs:h-5 xs:w-5"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                    stroke="currentcolor"
                    viewBox="0 0 24 24"
                    style="max-width: 40px"
                    aria-hidden="true"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>

                <Combobox.Input
                  id="etf-reverse-lookup-search"
                  on:input={search}
                  class="text-[0.85rem] sm:text-sm border border-line bg-surface-card rounded-full text-fg placeholder:text-muted dark:placeholder:text-zinc-300 px-3 py-2 pl-8 xs:pl-10 grow w-full focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80"
                  placeholder={etf_reverse_lookup_search_placeholder()}
                  aria-label={etf_reverse_lookup_search_placeholder()}
                />
              </div>
              <Combobox.Content
                class="z-10 rounded-container border border-line bg-surface-card p-2 text-fg shadow-none outline-hidden"
                sideOffset={8}
              >
                {#if inputValue?.length !== 0 && inputValue !== symbol}
                  {#each searchBarData as searchItem}
                    <Combobox.Item
                      class="py-2.5 cursor-pointer border-b border-line last:border-none flex h-fit w-auto select-none items-center rounded-container px-2 text-sm capitalize outline-hidden transition-all duration-75 data-highlighted:bg-surface-raised"
                      value={searchItem?.symbol}
                      label={searchItem?.symbol}
                    >
                      <div class="flex flex-col sm:flex-row items-start sm:items-center">
                        <span class="text-sm text-fg">
                          {searchItem?.symbol}
                        </span>
                        <span
                          class="ml-0 sm:ml-2 text-xs sm:text-sm text-fg"
                        >
                          {searchItem?.name}
                        </span>
                      </div>
                    </Combobox.Item>
                  {:else}
                    <span class="block px-5 py-2 text-sm text-fg">
                      {etf_reverse_lookup_search_no_matches()}
                    </span>
                  {/each}
                {:else}
                  <Combobox.Item
                    class="cursor-pointer border-b border-line last:border-none flex h-fit w-auto select-none items-center rounded-container py-1.5 pl-5 pr-1.5 text-sm capitalize outline-hidden"
                  >
                    <span class="text-sm text-fg">
                      {etf_reverse_lookup_search_start()}
                    </span>
                  </Combobox.Item>
                {/if}
              </Combobox.Content>
            </Combobox.Root>
          </div>

          {#if !symbol}
            <div
              class="mt-6 flex h-[clamp(320px,60vh,720px)] flex-col items-center justify-center rounded-container border border-line bg-surface-card p-8 text-center"
            >
              <p class="text-xl xs:text-2xl font-semibold text-fg">
                {etf_reverse_lookup_empty_headline()}
              </p>
              <p class="mt-2 max-w-lg text-fg-muted">
                {etf_reverse_lookup_intro()}
              </p>
              <div class="mt-6 flex flex-col items-center">
                <p class="mb-3 text-sm text-muted dark:text-zinc-400">
                  {etf_reverse_lookup_examples_label()}
                </p>
                <ul class="flex flex-wrap justify-center gap-2">
                  {#each EXAMPLE_SYMBOLS as example}
                    <li>
                      <a
                        href={localizedHref(`/etf-reverse-lookup?symbol=${example}`)}
                        class="block rounded-control border border-line bg-surface-card px-4 py-2 text-sm font-medium text-fg sm:hover:text-accent hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                      >
                        {example}
                      </a>
                    </li>
                  {/each}
                </ul>
              </div>
            </div>
          {:else}
            {#if data?.unavailable}
              <div class="mt-6 w-full flex items-center justify-start text-start">
                <Infobox text={etf_reverse_lookup_unavailable()} />
              </div>
            {:else if rows?.length}
              <div
                class="mt-6 grid grid-cols-1 divide-y divide-gray-200/70 dark:divide-zinc-800/80 rounded-container border border-line bg-surface-card sm:grid-cols-3 sm:divide-x sm:divide-y-0"
              >
                <div class="p-4 sm:p-6">
                  <div class="flex flex-row items-center gap-1">
                    <span class="text-sm text-fg">
                      {etf_reverse_lookup_summary_exposure()}
                    </span>
                    <InfoModal
                      title={etf_reverse_lookup_summary_exposure()}
                      content={etf_reverse_lookup_summary_exposure_info()}
                      id="exposureTotal"
                    />
                  </div>
                  <div
                    class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-fg"
                  >
                    {summary?.totalExposure !== null
                      ? abbreviateNumber(summary?.totalExposure, true)
                      : "-"}
                  </div>
                </div>

                <div class="p-4 sm:p-6">
                  <div class="flex flex-row items-center gap-1">
                    <span class="text-sm text-fg">
                      {etf_reverse_lookup_summary_avg_weight()}
                    </span>
                    <InfoModal
                      title={etf_reverse_lookup_summary_avg_weight()}
                      content={etf_reverse_lookup_summary_avg_weight_info()}
                      id="exposureAvgWeight"
                    />
                  </div>
                  <div
                    class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-fg"
                  >
                    {summary?.averageWeight !== null
                      ? `${summary?.averageWeight?.toFixed(2)}%`
                      : "-"}
                  </div>
                </div>

                <div class="p-4 sm:p-6">
                  <div class="flex flex-row items-center gap-1">
                    <span class="text-sm text-fg">
                      {etf_reverse_lookup_summary_aum()}
                    </span>
                    <InfoModal
                      title={etf_reverse_lookup_summary_aum()}
                      content={etf_reverse_lookup_summary_aum_info()}
                      id="exposureCombinedAum"
                    />
                  </div>
                  <div
                    class="mt-1 break-words font-semibold leading-8 text-lg sm:text-xl text-fg"
                  >
                    {summary?.combinedAssets !== null
                      ? abbreviateNumber(summary?.combinedAssets, true)
                      : "-"}
                  </div>
                </div>
              </div>

              {#key symbol}
                <Table
                  {data}
                  rawData={rows}
                  defaultList={EXPOSURE_DEFAULT_LIST()}
                  specificRows={EXPOSURE_SPECIFIC_ROWS()}
                  quickFilters={EXPOSURE_QUICK_FILTERS()}
                  showTabs={false}
                  showIndicators={false}
                  title={etf_reverse_lookup_heading({ symbol })}
                  expandable
                  expandLabel={(item) =>
                    etf_reverse_lookup_pie_toggle({ symbol: item?.symbol })}
                >
                  <svelte:fragment slot="rowDetail" let:item>
                    <ExposurePie etfSymbol={item?.symbol} highlightSymbol={symbol} />
                  </svelte:fragment>
                </Table>
              {/key}
            {:else}
              <div class="mt-6 w-full flex flex-col items-start justify-start text-start gap-2">
                <Infobox text={etf_reverse_lookup_empty({ symbol })} />
                <p class="text-sm text-muted dark:text-zinc-400">
                  {etf_reverse_lookup_empty_hint()}
                </p>
              </div>
            {/if}
          {/if}
        </main>
      </div>
    </div>
  </div>
</section>

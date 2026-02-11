<script lang="ts">
  import { getImageURL, convertToSlug } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import {
    learning_center_seo_description,
    learning_center_seo_keywords,
    learning_center_seo_title,
    learning_center_structured_articles,
    learning_center_structured_articles_description,
    learning_center_structured_description,
    learning_center_structured_name,
    learning_center_title,
    learning_center_subtitle,
    learning_center_category_all,
    learning_center_category_features,
    learning_center_category_fundamentals,
    learning_center_category_terms,
    learning_center_category_desc_features,
    learning_center_category_desc_fundamentals,
    learning_center_category_desc_terms,
    learning_center_tag_all,
    learning_center_tag_stocks,
    learning_center_tag_etf,
    learning_center_tag_options,
    learning_center_tag_sentiment,
    learning_center_tag_prefix,
    learning_center_view_all,
    learning_center_view_all_count,
    learning_center_min_read,
    learning_center_no_articles_tag,
    learning_center_clear_tag_filter,
    learning_center_previous,
    learning_center_next,
    learning_center_page_of,
    learning_center_items_count,
    learning_center_back_to_top,
    learning_center_no_terms_yet,
    learning_center_no_articles_category,
    learning_center_no_search_results,
    learning_center_clear_search,
  } from "$lib/paraglide/messages";
  import Calendar from "lucide-svelte/icons/calendar";
  import Clock from "lucide-svelte/icons/clock";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";

  export let data;

  let itemsPerPageOptions = [15, 20, 30];
  let searchInput = data?.searchFilter || "";
  let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  let searchInputEl: HTMLInputElement;

  // Client-side search state + cache
  let searchResultData: any = null; // null = use server data
  const searchCache = new Map<string, any>();
  const MAX_CACHE_SIZE = 50;
  const MAX_SEARCH_LENGTH = 100;

  $: activeCategory = data?.categoryFilter || "all";
  $: activeTag = data?.tagFilter || "all";
  $: activeSearch = searchResultData?.searchFilter ?? (data?.searchFilter || "");

  // When server data changes (navigation), reset client search state
  $: if (data) {
    searchResultData = null;
    searchInput = data?.searchFilter || "";
  }

  // Use client search results when available, otherwise server data
  $: displayData = searchResultData || data;

  // Pagination from whichever source is active
  $: currentPage = displayData?.view === "category" ? (displayData?.currentPage ?? 1) : 1;
  $: totalPages = displayData?.view === "category" ? (displayData?.totalPages ?? 1) : 1;
  $: itemsPerPage = displayData?.view === "category" ? (displayData?.perPage ?? 15) : 15;

  // Available tags for filtering
  const availableTags = [
    { id: "all", name: learning_center_tag_all() },
    { id: "Stocks", name: learning_center_tag_stocks() },
    { id: "ETF", name: learning_center_tag_etf() },
    { id: "Options", name: learning_center_tag_options() },
    { id: "Sentiment", name: learning_center_tag_sentiment() },
  ];

  // Category metadata
  const categories = [
    {
      id: "all",
      name: learning_center_category_all(),
    },
    {
      id: "Features",
      name: learning_center_category_features(),
      description: learning_center_category_desc_features(),
    },
    {
      id: "Fundamentals",
      name: learning_center_category_fundamentals(),
      description: learning_center_category_desc_fundamentals(),
    },
    {
      id: "Terms",
      name: learning_center_category_terms(),
      description: learning_center_category_desc_terms(),
    },
  ];

  function formatDate(dateString: string) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function buildUrl(overrides: Record<string, string | null> = {}) {
    const params = new URLSearchParams();
    const cat =
      overrides.category !== undefined ? overrides.category : activeCategory;
    const tag = overrides.tag !== undefined ? overrides.tag : activeTag;
    const pg = overrides.page !== undefined ? overrides.page : null;
    const pp = overrides.perPage !== undefined ? overrides.perPage : null;
    const sr = overrides.search !== undefined ? overrides.search : activeSearch;

    if (cat && cat !== "all") params.set("category", cat);
    if (tag && tag !== "all") params.set("tag", tag);
    if (sr) params.set("search", sr);
    if (pg && pg !== "1") params.set("page", pg);
    if (pp && pp !== "15") params.set("perPage", pp);

    const qs = params.toString();
    return `/learning-center${qs ? `?${qs}` : ""}`;
  }

  function silentUpdateUrl(overrides: Record<string, string | null> = {}) {
    if (browser) {
      const url = buildUrl(overrides);
      history.replaceState(history.state, "", url);
    }
  }

  let searchAbortController: AbortController | null = null;

  async function performSearch(query: string, pageNum: number) {
    const trimmed = query.slice(0, MAX_SEARCH_LENGTH);
    if (!trimmed) return;

    const cacheKey = `${activeCategory}:${activeTag}:${trimmed}:${pageNum}:${itemsPerPage}`;

    if (searchCache.has(cacheKey)) {
      searchResultData = searchCache.get(cacheKey);
      silentUpdateUrl({ search: trimmed, page: String(pageNum) });
      return;
    }

    // Cancel any in-flight request
    searchAbortController?.abort();
    searchAbortController = new AbortController();

    try {
      const params = new URLSearchParams({
        category: activeCategory,
        tag: activeTag,
        search: trimmed,
        page: String(pageNum),
        perPage: String(itemsPerPage),
      });

      const res = await fetch(`/api/search-collection?${params}`, {
        signal: searchAbortController.signal,
      });

      if (!res.ok) return;
      const result = await res.json();

      const resultData = {
        view: "category" as const,
        categoryFilter: result.category,
        tagFilter: result.tag,
        searchFilter: result.search,
        tutorials: result.tutorials,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        perPage: result.perPage,
      };

      // Evict oldest entry if cache is full
      if (searchCache.size >= MAX_CACHE_SIZE) {
        const firstKey = searchCache.keys().next().value;
        searchCache.delete(firstKey);
      }
      searchCache.set(cacheKey, resultData);

      // Only apply if the input still matches (user may have typed more)
      if (searchInput.trim() === query) {
        searchResultData = resultData;
        silentUpdateUrl({ search: trimmed, page: String(pageNum) });
      }
    } catch (e) {
      // Silently ignore aborted requests from rapid typing
    }
  }

  function handleSearchInput() {
    clearTimeout(searchDebounceTimer);
    const query = searchInput.trim();

    if (!query) {
      clearSearch();
      return;
    }

    searchDebounceTimer = setTimeout(() => {
      performSearch(query, 1);
    }, 150);
  }

  function clearSearch() {
    searchInput = "";
    clearTimeout(searchDebounceTimer);
    searchResultData = null;
    // Use goto() to re-run the server load with no search filter
    goto(buildUrl({ search: null, page: "1" }));
    searchInputEl?.focus();
  }

  function setCategory(categoryId: string) {
    searchInput = "";
    searchResultData = null;
    searchCache.clear();
    goto(buildUrl({ category: categoryId, page: null, perPage: null, search: null }));
  }

  function setTag(tagId: string) {
    searchInput = "";
    searchResultData = null;
    searchCache.clear();
    goto(buildUrl({ tag: tagId, page: "1", search: null }));
  }

  // Get the display name for the selected tag
  $: selectedTagName =
    availableTags.find((t) => t.id === activeTag)?.name || "All Tags";

  // Total count for SEO structured data
  $: totalCount =
    displayData?.view === "all" ? (displayData?.totalCount ?? 0) : (displayData?.totalItems ?? 0);

  function goToPage(pageNum: number) {
    if (pageNum >= 1 && pageNum <= totalPages) {
      const query = searchInput.trim();
      if (query) {
        performSearch(query, pageNum);
      } else {
        goto(buildUrl({ page: String(pageNum), perPage: String(itemsPerPage) }));
      }
      scrollToTop();
    }
  }

  function changeItemsPerPage(newItemsPerPage: number) {
    saveItemsPerPage(newItemsPerPage);
    searchCache.clear();
    searchResultData = null;
    goto(buildUrl({ page: "1", perPage: String(newItemsPerPage), search: searchInput.trim() || null }));
  }

  function saveItemsPerPage(value: number) {
    if (browser) {
      try {
        localStorage.setItem("learning-center_itemsPerPage", String(value));
      } catch (e) {
        // localStorage not available
      }
    }
  }

  function scrollToTop() {
    if (browser) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // On first load, apply localStorage perPage preference if no perPage in URL
  let initialPerPageApplied = false;
  $: if (browser && !initialPerPageApplied && data?.view === "category") {
    initialPerPageApplied = true;
    try {
      const saved = localStorage.getItem("learning-center_itemsPerPage");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (
          itemsPerPageOptions.includes(parsed) &&
          !$page.url.searchParams.has("perPage")
        ) {
          goto(buildUrl({ perPage: String(parsed) }), { replaceState: true });
        }
      }
    } catch (e) {
      // localStorage not available
    }
  }
</script>

<SEO
  title={learning_center_seo_title()}
  description={learning_center_seo_description()}
  keywords={learning_center_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: learning_center_structured_name(),
    description: learning_center_structured_description(),
    url: "https://stocknear.com/learning-center",
    educationalUse: "Investment Education",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
    },
    teaches: [
      "Stock Market Investing",
      "Technical Analysis",
      "Fundamental Analysis",
      "Portfolio Management",
      "Trading Strategies",
    ],
    mainEntity: {
      "@type": "ItemList",
      name: learning_center_structured_articles(),
      description: learning_center_structured_articles_description(),
      numberOfItems: totalCount,
    },
  }}
/>

<section class="w-full max-w-6xl mx-auto min-h-screen pb-20 pt-5 px-4 lg:px-6">
  <!-- Header -->
  <div class="mb-8">
    <h1
      class="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-1"
    >
      {learning_center_title()}
    </h1>
    <p class="text-gray-500 dark:text-zinc-400">
      {learning_center_subtitle()}
    </p>
  </div>

  <!-- Category Tabs and Tag Filter -->
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-300 dark:border-zinc-700 pb-4 mb-8"
  >
    <!-- Category Tabs -->
    <nav class="overflow-x-auto whitespace-nowrap">
      <ul class="flex flex-row items-center gap-1 text-sm sm:text-base">
        {#each categories as category}
          <button
            type="button"
            on:click={() => setCategory(category.id)}
            class="cursor-pointer px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition
              {activeCategory === category.id
              ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
              : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
          >
            {category.name}
          </button>
        {/each}
      </ul>
    </nav>

    <!-- Search + Tag Filter -->
    <div class="flex flex-row items-center gap-2 w-full sm:w-auto">
      {#if activeCategory !== "all"}
        <!-- Search Input -->
        <div class="relative grow sm:grow-0">
          <div
            class="inline-block cursor-pointer absolute right-2 top-2 text-sm"
          >
            {#if searchInput?.length > 0}
              <label
                class="cursor-pointer"
                on:click={clearSearch}
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
            bind:this={searchInputEl}
            bind:value={searchInput}
            on:input={handleSearchInput}
            type="text"
            maxlength={MAX_SEARCH_LENGTH}
            placeholder="Find..."
            class="py-2 text-sm border border-gray-300 shadow-sm dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 w-full sm:w-48"
          />
        </div>
      {/if}

    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          class="w-full sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-3 py-2 rounded-full"
        >
          <span class="text-sm">{learning_center_tag_prefix()} | {selectedTagName}</span>
          <svg
            class="-mr-1 ml-2 h-5 w-5 inline-block"
            viewBox="0 0 20 20"
            fill="currentColor"
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
        class="min-w-40 w-auto max-w-60 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-lg"
      >
        <DropdownMenu.Group>
          {#each availableTags as tag}
            <DropdownMenu.Item
              on:click={() => setTag(tag.id)}
              class="{activeTag === tag.id
                ? 'bg-gray-100/70 dark:bg-zinc-900/60'
                : ''} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 rounded-lg px-2 py-1.5"
            >
              <span>{tag.name}</span>
              {#if activeTag === tag.id}
                <svg
                  class="ml-auto h-4 w-4 text-violet-600 dark:text-violet-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              {/if}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    </div>
  </div>

  <!-- Active Category Description -->
  {#if activeCategory !== "all"}
    {@const activeCat = categories.find((c) => c.id === activeCategory)}
    {#if activeCat?.description}
      <p class="mb-6 text-sm text-gray-500 dark:text-zinc-400">
        {activeCat.description}
      </p>
    {/if}
  {/if}

  <!-- Show categorized sections when "All" is selected -->
  {#if displayData?.view === "all"}
    {@const sections = displayData.categorySections}

    <!-- Features Section -->
    {#if sections?.Features?.items?.length > 0}
      <div class="mb-12">
        <div class="flex items-baseline justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {learning_center_category_features()}
            </h2>
            <p class="text-sm text-gray-500 dark:text-zinc-400">
              {learning_center_category_desc_features()}
            </p>
          </div>
          {#if sections.Features.totalItems > 3}
            <button
              type="button"
              on:click={() => setCategory("Features")}
              class="cursor-pointer text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              {learning_center_view_all()}
            </button>
          {/if}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {#each sections.Features.items as item}
            <a
              href="/learning-center/article/{convertToSlug(item?.title)}"
              class="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
            >
              {#if item?.cover}
                <div class="h-40 overflow-hidden">
                  <img
                    src={getImageURL(item?.collectionId, item?.id, item?.cover)}
                    alt={item?.title}
                    class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              {:else}
                <div class="h-40 bg-gray-100 dark:bg-zinc-800"></div>
              {/if}
              <div class="flex flex-col flex-1 p-4">
                <h3
                  class="font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition line-clamp-2 mb-2"
                >
                  {item?.title}
                </h3>
                <p
                  class="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 mb-3"
                >
                  {item?.abstract}
                </p>
                <div
                  class="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500 mt-auto"
                >
                  <span>{learning_center_min_read({ time: String(item?.time || 5) })}</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Fundamentals Section -->
    {#if sections?.Fundamentals?.items?.length > 0}
      <div class="mb-12">
        <div class="flex items-baseline justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {learning_center_category_fundamentals()}
            </h2>
            <p class="text-sm text-gray-500 dark:text-zinc-400">
              {learning_center_category_desc_fundamentals()}
            </p>
          </div>
          {#if sections.Fundamentals.totalItems > 3}
            <button
              type="button"
              on:click={() => setCategory("Fundamentals")}
              class="cursor-pointer text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              {learning_center_view_all()}
            </button>
          {/if}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {#each sections.Fundamentals.items as item}
            <a
              href="/learning-center/article/{convertToSlug(item?.title)}"
              class="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
            >
              {#if item?.cover}
                <div class="h-40 overflow-hidden">
                  <img
                    src={getImageURL(item?.collectionId, item?.id, item?.cover)}
                    alt={item?.title}
                    class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              {:else}
                <div class="h-40 bg-gray-100 dark:bg-zinc-800"></div>
              {/if}
              <div class="flex flex-col flex-1 p-4">
                <h3
                  class="font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition line-clamp-2 mb-2"
                >
                  {item?.title}
                </h3>
                <p
                  class="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 mb-3"
                >
                  {item?.abstract}
                </p>
                <div
                  class="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500 mt-auto"
                >
                  <span>{learning_center_min_read({ time: String(item?.time || 5) })}</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Terms Section - Compact list style -->
    {#if sections?.Terms?.items?.length > 0}
      <div class="mb-12">
        <div class="flex items-baseline justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {learning_center_category_terms()}
            </h2>
            <p class="text-sm text-gray-500 dark:text-zinc-400">
              {learning_center_category_desc_terms()}
            </p>
          </div>
          {#if sections.Terms.totalItems > 6}
            <button
              type="button"
              on:click={() => setCategory("Terms")}
              class="cursor-pointer text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              {learning_center_view_all_count({ count: String(sections.Terms.totalItems) })}
            </button>
          {/if}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {#each sections.Terms.items as item}
            <a
              href="/learning-center/article/{convertToSlug(item?.title)}"
              class="group flex items-center gap-3 p-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <h3
                  class="font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition truncate"
                >
                  {item?.title}
                </h3>
              </div>
              <svg
                class="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 transition flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Empty state when tag filter has no results -->
    {#if activeTag !== "all" && !sections?.Fundamentals?.items?.length && !sections?.Features?.items?.length && !sections?.Terms?.items?.length}
      <div class="text-center py-12">
        <p class="text-gray-500 dark:text-zinc-400">
          {learning_center_no_articles_tag({ tag: selectedTagName })}
        </p>
        <button
          type="button"
          on:click={() => setTag("all")}
          class="cursor-pointer mt-4 text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          {learning_center_clear_tag_filter()}
        </button>
      </div>
    {/if}
  {:else if displayData?.view === "category" && activeCategory === "Terms"}
    <!-- Terms Filtered View - Alphabetical list -->
    {#if displayData?.tutorials?.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each displayData.tutorials as item}
          <a
            href="/learning-center/article/{convertToSlug(item?.title)}"
            class="group flex items-center gap-3 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <h3
                class="font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
              >
                {item?.title}
              </h3>
              <p
                class="text-sm text-gray-500 dark:text-zinc-400 line-clamp-1 mt-1"
              >
                {item?.abstract}
              </p>
            </div>
            <svg
              class="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 transition flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        {/each}
      </div>

      <!-- Pagination Controls -->
      {#if totalPages > 1}
        <div class="flex flex-row items-center justify-between mt-8">
          <!-- Previous button -->
          <Button
            on:click={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            class="transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex items-center px-3 py-2 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              class="h-5 w-5 rotate-90"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <span class="hidden sm:inline ml-1">{learning_center_previous()}</span>
          </Button>

          <!-- Page info and items per page -->
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600 dark:text-zinc-300">
              {learning_center_page_of({ currentPage: String(currentPage), totalPages: String(totalPages) })}
            </span>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex items-center px-3 py-2 rounded-full"
                >
                  <span class="text-sm">{learning_center_items_count({ count: String(itemsPerPage) })}</span>
                  <svg
                    class="ml-1 h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
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
                align="center"
                sideOffset={10}
                class="min-w-32 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200"
              >
                <DropdownMenu.Group>
                  {#each itemsPerPageOptions as option}
                    <DropdownMenu.Item
                      on:click={() => changeItemsPerPage(option)}
                      class="{itemsPerPage === option
                        ? 'bg-gray-100/70 dark:bg-zinc-900/60'
                        : ''} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 rounded-lg px-2 py-1.5"
                    >
                      <span class="text-sm">{learning_center_items_count({ count: String(option) })}</span>
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>

          <!-- Next button -->
          <Button
            on:click={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            class="transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex items-center px-3 py-2 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span class="hidden sm:inline mr-1">{learning_center_next()}</span>
            <svg
              class="h-5 w-5 -rotate-90"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </Button>
        </div>

        <!-- Back to Top -->
        <div class="flex justify-center mt-4">
          <button
            on:click={scrollToTop}
            class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
          >
            {learning_center_back_to_top()}
            <svg
              class="h-5 w-5 inline-block rotate-180"
              viewBox="0 0 20 20"
              fill="currentColor"
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
      <div class="text-center py-12">
        {#if activeSearch}
          <p class="text-gray-500 dark:text-zinc-400">{learning_center_no_search_results({ query: activeSearch })}</p>
          <button
            type="button"
            on:click={clearSearch}
            class="cursor-pointer mt-4 text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            {learning_center_clear_search()}
          </button>
        {:else}
          <p class="text-gray-500 dark:text-zinc-400">{learning_center_no_terms_yet()}</p>
        {/if}
      </div>
    {/if}
  {:else if displayData?.view === "category"}
    <!-- Filtered Category View (non-Terms) -->
    {#if displayData?.tutorials?.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {#each displayData.tutorials as item}
          <a
            href="/learning-center/article/{convertToSlug(item?.title)}"
            class="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
          >
            {#if item?.cover}
              <div class="h-40 overflow-hidden">
                <img
                  src={getImageURL(item?.collectionId, item?.id, item?.cover)}
                  alt={item?.title}
                  class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            {:else}
              <div class="h-40 bg-gray-100 dark:bg-zinc-800">
                <img
                  src="/img/premarket-news-cover.webp"
                  alt="Premarket News Report"
                  class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            {/if}
            <div class="flex flex-col flex-1 p-4">
              <h3
                class="font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition line-clamp-2 mb-2"
              >
                {item?.title}
              </h3>
              <p
                class="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 mb-3"
              >
                {item?.abstract}
              </p>
              <div
                class="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500 mt-auto"
              >
                <div class="flex items-center gap-1">
                  <Calendar class="w-3.5 h-3.5" />
                  <span>{formatDate(item?.created)}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5" />
                  <span>{learning_center_min_read({ time: String(item?.time || 5) })}</span>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>

      <!-- Pagination Controls -->
      {#if totalPages > 1}
        <div class="flex flex-row items-center justify-between mt-8">
          <!-- Previous button -->
          <Button
            on:click={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            class="transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex items-center px-3 py-2 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              class="h-5 w-5 rotate-90"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <span class="hidden sm:inline ml-1">{learning_center_previous()}</span>
          </Button>

          <!-- Page info and items per page -->
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600 dark:text-zinc-300">
              {learning_center_page_of({ currentPage: String(currentPage), totalPages: String(totalPages) })}
            </span>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex items-center px-3 py-2 rounded-full"
                >
                  <span class="text-sm">{learning_center_items_count({ count: String(itemsPerPage) })}</span>
                  <svg
                    class="ml-1 h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
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
                align="center"
                sideOffset={10}
                class="min-w-32 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200"
              >
                <DropdownMenu.Group>
                  {#each itemsPerPageOptions as option}
                    <DropdownMenu.Item
                      on:click={() => changeItemsPerPage(option)}
                      class="{itemsPerPage === option
                        ? 'bg-gray-100/70 dark:bg-zinc-900/60'
                        : ''} cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 rounded-lg px-2 py-1.5"
                    >
                      <span class="text-sm">{learning_center_items_count({ count: String(option) })}</span>
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>

          <!-- Next button -->
          <Button
            on:click={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            class="transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex items-center px-3 py-2 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span class="hidden sm:inline mr-1">{learning_center_next()}</span>
            <svg
              class="h-5 w-5 -rotate-90"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </Button>
        </div>

        <!-- Back to Top -->
        <div class="flex justify-center mt-4">
          <button
            on:click={scrollToTop}
            class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
          >
            {learning_center_back_to_top()}
            <svg
              class="h-5 w-5 inline-block rotate-180"
              viewBox="0 0 20 20"
              fill="currentColor"
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
      <div class="text-center py-12">
        {#if activeSearch}
          <p class="text-gray-500 dark:text-zinc-400">{learning_center_no_search_results({ query: activeSearch })}</p>
          <button
            type="button"
            on:click={clearSearch}
            class="cursor-pointer mt-4 text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            {learning_center_clear_search()}
          </button>
        {:else}
          <p class="text-gray-500 dark:text-zinc-400">
            {learning_center_no_articles_category()}
          </p>
        {/if}
      </div>
    {/if}
  {/if}
</section>

<style>
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>

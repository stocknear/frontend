<script lang="ts">
  import { getImageURL, convertToSlug } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import {
    learning_center_seo_description,
    learning_center_seo_keywords,
    learning_center_seo_title,
    learning_center_structured_articles,
    learning_center_structured_articles_description,
    learning_center_structured_description,
    learning_center_structured_name,
  } from "$lib/paraglide/messages";
  import Calendar from "lucide-svelte/icons/calendar";
  import Clock from "lucide-svelte/icons/clock";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";

  export let data;

  $: tutorialsByCategory = data?.tutorialsByCategory;
  $: allTutorials = data?.allTutorials || [];
  $: activeCategory = $page.url.searchParams.get("category") || "all";
  $: activeTag = $page.url.searchParams.get("tag") || "all";

  // Available tags for filtering
  const availableTags = [
    { id: "all", name: "All Tags" },
    { id: "Stocks", name: "Stocks" },
    { id: "ETF", name: "ETF" },
    { id: "Options", name: "Options" },
    { id: "Sentiment", name: "Sentiment" },
  ];

  // Category metadata
  const categories = [
    {
      id: "all",
      name: "All",
    },
    {
      id: "Fundamentals",
      name: "Fundamentals",
      description: "Start here if you're new to investing",
    },
    {
      id: "Concepts",
      name: "Concepts",
      description: "Market indicators and mechanics",
    },
    {
      id: "Strategies",
      name: "Strategies",
      description: "Trading approaches and methodologies",
    },
    {
      id: "Features",
      name: "Features",
      description: "How to use Stocknear",
    },
    {
      id: "Terms",
      name: "Terms",
      description: "Financial terms and definitions",
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



  function setCategory(categoryId: string) {
    const params = new URLSearchParams();
    if (categoryId !== "all") {
      params.set("category", categoryId);
    }
    if (activeTag !== "all") {
      params.set("tag", activeTag);
    }
    const queryString = params.toString();
    goto(`/learning-center${queryString ? `?${queryString}` : ""}`);
  }

  function setTag(tagId: string) {
    const params = new URLSearchParams();
    if (activeCategory !== "all") {
      params.set("category", activeCategory);
    }
    if (tagId !== "all") {
      params.set("tag", tagId);
    }
    const queryString = params.toString();
    goto(`/learning-center${queryString ? `?${queryString}` : ""}`);
  }

  // Get the display name for the selected tag
  $: selectedTagName = availableTags.find(t => t.id === activeTag)?.name || "All Tags";

  // Filter tutorials by tag - inline to ensure reactivity
  function filterByTag(tutorials: any[], tag: string) {
    if (tag === "all") return tutorials;
    return tutorials.filter((item) => {
      const tags = item?.tags || [];
      return tags.includes(tag);
    });
  }

  // Get tutorials to display based on active category and tag
  $: displayTutorials = filterByTag(
    activeCategory === "all"
      ? allTutorials
      : tutorialsByCategory?.[activeCategory] || [],
    activeTag
  );

  // Also filter the categorized tutorials for the "all" view
  $: filteredByCategory = {
    Fundamentals: filterByTag(tutorialsByCategory?.Fundamentals || [], activeTag),
    Concepts: filterByTag(tutorialsByCategory?.Concepts || [], activeTag),
    Strategies: filterByTag(tutorialsByCategory?.Strategies || [], activeTag),
    Features: filterByTag(tutorialsByCategory?.Features || [], activeTag),
    Terms: filterByTag(tutorialsByCategory?.Terms || [], activeTag),
  };
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
      numberOfItems: allTutorials?.length || 0,
    },
  }}
/>

<section class="w-full max-w-6xl mx-auto min-h-screen pb-20 pt-5 px-4 lg:px-6">
  <!-- Header -->
  <div class="mb-8">
    <h1
      class="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-1"
    >
      Learning Center
    </h1>
    <p class="text-gray-500 dark:text-zinc-400">
      Master the stock market, one concept at a time
    </p>
  </div>

  <!-- Category Tabs and Tag Filter -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-300 dark:border-zinc-700 pb-4 mb-8">
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

    <!-- Tag Filter Dropdown -->
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          class="w-full sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white/80 dark:hover:bg-zinc-900/70 flex flex-row justify-between items-center px-3 py-2 rounded-full"
        >
          <span class="text-sm">Tag | {selectedTagName}</span>
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
                <svg class="ml-auto h-4 w-4 text-violet-600 dark:text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              {/if}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
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
  {#if activeCategory === "all"}
    <!-- Fundamentals Section -->
    {#if filteredByCategory?.Fundamentals?.length > 0}
      <div class="mb-12">
        <div class="flex items-baseline justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Fundamentals
            </h2>
            <p class="text-sm text-gray-500 dark:text-zinc-400">
              Start here if you're new to investing
            </p>
          </div>
          {#if filteredByCategory.Fundamentals.length > 3}
            <button
              type="button"
              on:click={() => setCategory("Fundamentals")}
              class="cursor-pointer text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              View all
            </button>
          {/if}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {#each filteredByCategory.Fundamentals.slice(0, 3) as item}
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
                  <span>{item?.time || 5} min read</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Concepts Section -->
    {#if filteredByCategory?.Concepts?.length > 0}
      <div class="mb-12">
        <div class="flex items-baseline justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Concepts
            </h2>
            <p class="text-sm text-gray-500 dark:text-zinc-400">
              Market indicators and mechanics
            </p>
          </div>
          {#if filteredByCategory.Concepts.length > 3}
            <button
              type="button"
              on:click={() => setCategory("Concepts")}
              class="cursor-pointer text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              View all
            </button>
          {/if}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {#each filteredByCategory.Concepts.slice(0, 3) as item}
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
                  <span>{item?.time || 5} min read</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Strategies Section -->
    {#if filteredByCategory?.Strategies?.length > 0}
      <div class="mb-12">
        <div class="flex items-baseline justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Strategies
            </h2>
            <p class="text-sm text-gray-500 dark:text-zinc-400">
              Trading approaches and methodologies
            </p>
          </div>
          {#if filteredByCategory.Strategies.length > 3}
            <button
              type="button"
              on:click={() => setCategory("Strategies")}
              class="cursor-pointer text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              View all
            </button>
          {/if}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {#each filteredByCategory.Strategies.slice(0, 3) as item}
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
                  <span>{item?.time || 5} min read</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Features Section -->
    {#if filteredByCategory?.Features?.length > 0}
      <div class="mb-12">
        <div class="flex items-baseline justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Features
            </h2>
            <p class="text-sm text-gray-500 dark:text-zinc-400">
              How to use Stocknear
            </p>
          </div>
          {#if filteredByCategory.Features.length > 3}
            <button
              type="button"
              on:click={() => setCategory("Features")}
              class="cursor-pointer text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              View all
            </button>
          {/if}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {#each filteredByCategory.Features.slice(0, 3) as item}
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
                  <span>{item?.time || 5} min read</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Terms Section - Compact list style -->
    {#if filteredByCategory?.Terms?.length > 0}
      <div class="mb-12">
        <div class="flex items-baseline justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Terms
            </h2>
            <p class="text-sm text-gray-500 dark:text-zinc-400">
              Financial terms and definitions
            </p>
          </div>
          {#if filteredByCategory.Terms.length > 6}
            <button
              type="button"
              on:click={() => setCategory("Terms")}
              class="cursor-pointer text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              View all {filteredByCategory.Terms.length}
            </button>
          {/if}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {#each filteredByCategory.Terms.slice(0, 6).sort((a, b) => a.title.localeCompare(b.title)) as item}
            <a
              href="/learning-center/article/{convertToSlug(item?.title)}"
              class="group flex items-center gap-3 p-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition truncate">
                  {item?.title}
                </h3>
              </div>
              <svg class="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 transition flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Empty state when tag filter has no results -->
    {#if activeTag !== "all" && !filteredByCategory.Fundamentals.length && !filteredByCategory.Concepts.length && !filteredByCategory.Strategies.length && !filteredByCategory.Features.length && !filteredByCategory.Terms.length}
      <div class="text-center py-12">
        <p class="text-gray-500 dark:text-zinc-400">
          No articles found with the "{selectedTagName}" tag.
        </p>
        <button
          type="button"
          on:click={() => setTag("all")}
          class="cursor-pointer mt-4 text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          Clear tag filter
        </button>
      </div>
    {/if}
  {:else if activeCategory === "Terms"}
    <!-- Terms Filtered View - Alphabetical list -->
    {#if displayTutorials?.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each [...displayTutorials].sort((a, b) => a.title.localeCompare(b.title)) as item}
          <a
            href="/learning-center/article/{convertToSlug(item?.title)}"
            class="group flex items-center gap-3 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                {item?.title}
              </h3>
              <p class="text-sm text-gray-500 dark:text-zinc-400 line-clamp-1 mt-1">
                {item?.abstract}
              </p>
            </div>
            <svg class="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 transition flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        {/each}
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-gray-500 dark:text-zinc-400">
          No terms available yet.
        </p>
      </div>
    {/if}
  {:else}
    <!-- Filtered Category View (non-Terms) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {#if displayTutorials?.length > 0}
        {#each displayTutorials as item}
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
                <div class="flex items-center gap-1">
                  <Calendar class="w-3.5 h-3.5" />
                  <span>{formatDate(item?.created)}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5" />
                  <span>{item?.time || 5} min</span>
                </div>
              </div>
            </div>
          </a>
        {/each}
      {:else}
        <div class="col-span-full text-center py-12">
          <p class="text-gray-500 dark:text-zinc-400">
            No articles in this category yet.
          </p>
        </div>
      {/if}
    </div>
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

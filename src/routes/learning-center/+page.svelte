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

  export let data;

  $: tutorialsByCategory = data?.tutorialsByCategory;
  $: allTutorials = data?.allTutorials || [];
  $: activeCategory = $page.url.searchParams.get("category") || "all";

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
  ];

  function formatDate(dateString: string) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getReadingTime(content: string) {
    if (!content) return 1;
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  function setCategory(categoryId: string) {
    if (categoryId === "all") {
      goto("/learning-center");
    } else {
      goto(`/learning-center?category=${categoryId}`);
    }
  }

  // Get tutorials to display based on active category
  $: displayTutorials =
    activeCategory === "all"
      ? allTutorials
      : tutorialsByCategory?.[activeCategory] || [];
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

  <!-- Category Tabs -->
  <div class="mb-8 border-b border-gray-200 dark:border-zinc-800">
    <div class="flex gap-6 overflow-x-auto pb-px hide-scrollbar">
      {#each categories as category}
        <button
          type="button"
          on:click={() => setCategory(category.id)}
          class="cursor-pointer pb-3 text-sm font-medium whitespace-nowrap transition-colors relative
            {activeCategory === category.id
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}"
        >
          {category.name}
          {#if activeCategory === category.id}
            <div
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
            ></div>
          {/if}
        </button>
      {/each}
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
  {#if activeCategory === "all"}
    <!-- Fundamentals Section -->
    {#if tutorialsByCategory?.Fundamentals?.length > 0}
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
          {#if tutorialsByCategory.Fundamentals.length > 3}
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
          {#each tutorialsByCategory.Fundamentals.slice(0, 3) as item}
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
                  <span>{getReadingTime(item?.description)} min read</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Concepts Section -->
    {#if tutorialsByCategory?.Concepts?.length > 0}
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
          {#if tutorialsByCategory.Concepts.length > 3}
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
          {#each tutorialsByCategory.Concepts.slice(0, 3) as item}
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
                  <span>{getReadingTime(item?.description)} min read</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Strategies Section -->
    {#if tutorialsByCategory?.Strategies?.length > 0}
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
          {#if tutorialsByCategory.Strategies.length > 3}
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
          {#each tutorialsByCategory.Strategies.slice(0, 3) as item}
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
                  <span>{getReadingTime(item?.description)} min read</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Features Section -->
    {#if tutorialsByCategory?.Features?.length > 0}
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
          {#if tutorialsByCategory.Features.length > 3}
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
          {#each tutorialsByCategory.Features.slice(0, 3) as item}
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
                  <span>{getReadingTime(item?.description)} min read</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <!-- Filtered Category View -->
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
                  <span>{getReadingTime(item?.description)} min</span>
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
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>

<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { getImageURL } from "$lib/utils";
  import { toast } from "svelte-sonner";
  import {
    learning_center_editor_title,
    learning_center_editor_articles,
    learning_center_editor_new_article,
    learning_center_editor_delete_confirm,
    learning_center_editor_cancel,
    learning_center_editor_no_articles,
    learning_center_editor_search,
    learning_center_editor_edit,
  } from "$lib/paraglide/messages";

  // Icons
  import Plus from "lucide-svelte/icons/plus";
  import Pencil from "lucide-svelte/icons/pencil";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import Search from "lucide-svelte/icons/search";
  import FileText from "lucide-svelte/icons/file-text";

  export let data;

  // State
  let searchQuery = "";
  let showDeleteModal = false;
  let deletingItem: { id: string; name: string } | null = null;

  // Reactive data
  $: articles = data?.articles || [];

  // Filtered articles
  $: filteredArticles = articles.filter((article: any) => {
    const matchesSearch = article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.abstract?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Open delete confirmation
  function openDeleteModal(id: string, name: string) {
    deletingItem = { id, name };
    showDeleteModal = true;
  }

  function closeDeleteModal() {
    showDeleteModal = false;
    deletingItem = null;
  }

  // Format date
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Get tag colors
  function getTagColor(tag: string): string {
    const colors: Record<string, string> = {
      "Stocks": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      "ETF": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
      "Options": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
      "Sentiment": "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
    };
    return colors[tag] || "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  }
</script>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-gray-700 dark:text-zinc-200"
>
  <div class="w-full overflow-hidden m-auto mt-5">
    <!-- Header -->
    <div class="mb-6 border-b border-gray-300 dark:border-zinc-700 pb-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {learning_center_editor_title()}
        </h1>
        <div class="flex items-center gap-2">
          <a
            href="/learning-center/editor/new"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition"
          >
            <Plus class="w-4 h-4" />
            {learning_center_editor_new_article()}
          </a>
        </div>
      </div>

      <!-- Articles count -->
      <div class="flex gap-4 mt-4">
        <div class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
          <FileText class="w-4 h-4" />
          {learning_center_editor_articles()}
          <span class="ml-1 px-2 py-0.5 rounded-full bg-violet-200 dark:bg-violet-800 text-xs">
            {articles.length}
          </span>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder={learning_center_editor_search()}
          class="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-violet-500"
        />
      </div>
    </div>

    <!-- Articles Grid -->
    {#if filteredArticles.length === 0}
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <FileText class="w-12 h-12 text-gray-300 dark:text-zinc-600 mb-4" />
        <p class="text-gray-500 dark:text-zinc-400">{learning_center_editor_no_articles()}</p>
        <a
          href="/learning-center/editor/new"
          class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition"
        >
          <Plus class="w-4 h-4" />
          {learning_center_editor_new_article()}
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each filteredArticles as article}
          <div
            class="flex flex-col overflow-hidden rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40"
          >
            {#if article.cover}
              <div class="relative h-40 overflow-hidden">
                <img
                  src={getImageURL(article.collectionId, article.id, article.cover)}
                  alt={article.title}
                  class="w-full h-full object-cover"
                />
              </div>
            {/if}
            <div class="flex-1 p-4">
              <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-2">
                {article.title}
              </h3>
              <p class="mt-2 text-sm text-gray-600 dark:text-zinc-400 line-clamp-2">
                {article.abstract || "No description"}
              </p>
              <!-- Tags -->
              {#if article.tags && article.tags.length > 0}
                <div class="flex flex-wrap gap-1 mt-2">
                  {#each article.tags as tag}
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium {getTagColor(tag)}">
                      {tag}
                    </span>
                  {/each}
                </div>
              {/if}
              <p class="mt-2 text-xs text-gray-400 dark:text-zinc-500">
                {formatDate(article.created)}
              </p>
            </div>
            <div class="flex items-center gap-2 p-4 pt-0">
              <a
                href="/learning-center/editor/{article.id}"
                class="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-gray-300 dark:border-zinc-700 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
              >
                <Pencil class="w-4 h-4" />
                {learning_center_editor_edit()}
              </a>
              <button
                on:click={() => openDeleteModal(article.id, article.title)}
                class="p-2 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition cursor-pointer"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && deletingItem}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button
      on:click={closeDeleteModal}
      class="absolute inset-0 bg-black/50 cursor-pointer"
    ></button>
    <div
      class="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-gray-300 dark:border-zinc-700 shadow-2xl p-6"
    >
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Delete Article
      </h3>
      <p class="text-gray-600 dark:text-zinc-400 mb-2">
        {learning_center_editor_delete_confirm()}
      </p>
      <p class="text-sm font-medium text-gray-900 dark:text-white mb-6">
        "{deletingItem.name}"
      </p>

      <form
        method="POST"
        action="?/deleteArticle"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === "success") {
              toast.success("Deleted successfully");
              closeDeleteModal();
              await invalidateAll();
            } else {
              toast.error("Failed to delete");
            }
          };
        }}
        class="flex gap-3"
      >
        <input type="hidden" name="id" value={deletingItem.id} />
        <button
          type="button"
          on:click={closeDeleteModal}
          class="flex-1 px-4 py-2.5 rounded-full border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          {learning_center_editor_cancel()}
        </button>
        <button
          type="submit"
          class="flex-1 px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-medium transition cursor-pointer"
        >
          Delete
        </button>
      </form>
    </div>
  </div>
{/if}

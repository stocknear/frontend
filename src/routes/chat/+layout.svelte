<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { DateTime } from "luxon";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import {
    chat_no_threads,
    chat_delete_thread_title,
    chat_delete_thread_confirm,
    chat_cancel,
    chat_delete,
    chat_toast_deleted,
    chat_toast_error,
    chat_toast_error_occurred,
  } from "$lib/paraglide/messages";
  import { chatSidebarOpen, chatDeleteTargetId } from "$lib/store";

  export let data;
  let searchQuery = "";
  let searchTimeout: ReturnType<typeof setTimeout>;
  let currentItem: any = {};

  $: allChats = data?.allChats || [];
  $: currentSlug = $page.params?.slug || "";

  // Debounced search filter
  let filteredSearch = "";
  function handleSearch(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    searchQuery = value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filteredSearch = value.toLowerCase().trim();
    }, 300);
  }

  $: filteredChats = filteredSearch
    ? allChats.filter((c) =>
        c.message?.toLowerCase().includes(filteredSearch),
      )
    : allChats;

  // Date grouping
  function getDateGroup(dateString: string) {
    const isoDateString = dateString.replace(" ", "T");
    const date = DateTime.fromISO(isoDateString, { zone: "utc" });
    const now = DateTime.utc();
    const diffDays = now.diff(date, "days").days;

    if (diffDays < 1) return "Today";
    if (diffDays < 2) return "Yesterday";
    if (diffDays < 7) return "Previous 7 Days";
    if (diffDays < 30) return "Previous 30 Days";
    return "Older";
  }

  const groupOrder = [
    "Today",
    "Yesterday",
    "Previous 7 Days",
    "Previous 30 Days",
    "Older",
  ];

  $: groupedChats = (() => {
    if (filteredSearch) return null; // Flat list when searching
    const groups: Record<string, typeof allChats> = {};
    for (const chat of filteredChats) {
      const group = getDateGroup(chat.updated);
      if (!groups[group]) groups[group] = [];
      groups[group].push(chat);
    }
    return groups;
  })();

  function formatRelativeTime(dateString: string) {
    const isoDateString = dateString.replace(" ", "T");
    const date = DateTime.fromISO(isoDateString, { zone: "utc" });
    const now = DateTime.utc();
    const diffMinutes = Math.abs(now.diff(date, "minutes").minutes);

    if (diffMinutes < 60) return `${Math.round(diffMinutes)}m ago`;
    if (diffMinutes < 1440) {
      const hours = Math.round(diffMinutes / 60);
      return `${hours}h ago`;
    }
    const days = Math.round(diffMinutes / 1440);
    return `${days}d ago`;
  }

  function truncate(text: string, max = 80) {
    if (!text) return "";
    return text.length > max ? text.slice(0, max) + "..." : text;
  }

  function handleChatClick() {
    $chatSidebarOpen = false;
  }

  function openDeleteModal(threadId: string) {
    if (!threadId) return;
    currentItem = allChats.find((item) => item.id === threadId) || { id: threadId };
    if (typeof document !== "undefined") {
      const modal = document.getElementById("deleteThreadModal");
      modal?.dispatchEvent(new MouseEvent("click"));
    }
  }

  $: if ($chatDeleteTargetId) {
    openDeleteModal($chatDeleteTargetId);
    chatDeleteTargetId.set(null);
  }

  async function handleDeleteThread() {
    try {
      const response = await fetch("/api/delete-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: currentItem?.id }),
      });

      if (!response.ok) {
        const err = await response.json();
        toast.error(
          typeof err === "string" ? err : err?.error || chat_toast_error(),
          {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          },
        );
        return;
      }

      const output = await response.json();

      if (output === "success") {
        toast.success(chat_toast_deleted(), {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });

        allChats = allChats.filter((item) => item.id !== currentItem?.id);

        // If we deleted the current chat, navigate to /chat
        if (currentItem?.id === currentSlug) {
          goto("/chat");
        }
      } else {
        toast.error(chat_toast_error(), {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(chat_toast_error_occurred(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }
</script>

<div class="flex w-full min-h-screen bg-white dark:bg-default">
  <!-- Mobile backdrop -->
  {#if $chatSidebarOpen}
    <button
      class="cursor-pointer lg:hidden fixed inset-0 bg-black/40 z-40"
      on:click={() => ($chatSidebarOpen = false)}
      aria-label="Close sidebar"
    />
  {/if}

  <!-- Sidebar -->
  {#if data?.user && allChats?.length > 0}
    <aside
      class="fixed top-0 left-0 z-50 lg:z-30 h-screen w-[280px] pt-0 lg:pt-16 border-r border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 flex flex-col transition-transform duration-200 ease-out {$chatSidebarOpen
        ? 'translate-x-0'
        : '-translate-x-full lg:translate-x-0'}"
    >
      <!-- Sidebar header -->
      <div class="p-3 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <a
            href="/chat"
            on:click={handleChatClick}
            class="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 sm:hover:bg-gray-100 dark:sm:hover:bg-zinc-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            New Chat
          </a>

          <!-- Close button (mobile only) -->
          <button
            on:click={() => ($chatSidebarOpen = false)}
            class="cursor-pointer lg:hidden p-2 ml-auto rounded-lg text-gray-500 dark:text-zinc-400 sm:hover:bg-gray-200 dark:sm:hover:bg-zinc-800 transition"
            aria-label="Close sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <!-- Search -->
        <div class="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            on:input={handleSearch}
            class="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-gray-400 dark:focus:border-zinc-600 transition"
          />
        </div>
      </div>

      <!-- Chat list -->
      <nav class="flex-1 overflow-y-auto px-2 pb-4 scroller">
        {#if filteredChats.length === 0}
          <p
            class="px-3 py-6 text-sm text-center text-gray-500 dark:text-zinc-400"
          >
            {filteredSearch ? "No chats found" : chat_no_threads()}
          </p>
        {:else if groupedChats}
          <!-- Grouped by date -->
          {#each groupOrder as group}
            {#if groupedChats[group]?.length > 0}
              <div class="mt-3 first:mt-0">
                <h3
                  class="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wide"
                >
                  {group}
                </h3>
                {#each groupedChats[group] as item}
                  <a
                    href="/chat/{item.id}"
                    on:click={handleChatClick}
                    class="group flex items-center gap-2 px-3 py-2.5 mb-0.5 rounded-xl text-sm transition-colors {currentSlug ===
                    item.id
                      ? 'bg-gray-200/80 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium'
                      : 'text-gray-700 dark:text-zinc-300 sm:hover:bg-gray-100 dark:sm:hover:bg-zinc-800/60'}"
                  >
                    <span class="flex-1 truncate">
                      {truncate(item.message)}
                    </span>
                    <button
                      on:click|preventDefault|stopPropagation={() => {
                        openDeleteModal(item.id);
                      }}
                      class="cursor-pointer flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-gray-400 dark:text-zinc-500 sm:hover:text-red-500 dark:sm:hover:text-red-400 transition"
                      aria-label="Delete chat"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </a>
                {/each}
              </div>
            {/if}
          {/each}
        {:else}
          <!-- Flat search results -->
          {#each filteredChats as item}
            <a
              href="/chat/{item.id}"
              on:click={handleChatClick}
              class="group flex items-center gap-2 px-3 py-2.5 mb-0.5 rounded-xl text-sm transition-colors {currentSlug ===
              item.id
                ? 'bg-gray-200/80 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium'
                : 'text-gray-700 dark:text-zinc-300 sm:hover:bg-gray-100 dark:sm:hover:bg-zinc-800/60'}"
            >
              <span class="flex-1 truncate">
                {truncate(item.message)}
              </span>
              <span
                class="flex-shrink-0 text-xs text-gray-400 dark:text-zinc-500"
              >
                {formatRelativeTime(item.updated)}
              </span>
            </a>
          {/each}
        {/if}
      </nav>
    </aside>
  {/if}

  <!-- Main content -->
  <div
    class="flex-1 min-w-0 {data?.user && allChats?.length > 0
      ? 'lg:ml-[280px]'
      : ''}"
  >
    <slot />
  </div>
</div>

<!-- Delete confirmation modal -->
<input type="checkbox" id="deleteThreadModal" class="modal-toggle" />

<dialog id="deleteThreadModal" class="modal modal-middle p-3 sm:p-0">
  <label for="deleteThreadModal" class="cursor-pointer modal-backdrop" />

  <div
    class="modal-box w-full p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="deleteThreadModal"
      class="inline-block cursor-pointer absolute right-4 top-4 text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
    >
      <svg
        class="w-6 h-6"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        />
      </svg>
    </label>
    <h3 class="text-lg font-medium mb-2">{chat_delete_thread_title()}</h3>
    <p class="text-sm mb-6">{chat_delete_thread_confirm()}</p>
    <div class="flex justify-end space-x-3">
      <label
        for="deleteThreadModal"
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
        tabindex="0">{chat_cancel()}</label
      >
      <label
        for="deleteThreadModal"
        on:click={handleDeleteThread}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 flex items-center border border-rose-200/70 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"
        tabindex="0"
      >
        <svg
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 mr-2"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polyline points="3 6 5 6 21 6" />
          <path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
        {chat_delete()}
      </label>
    </div>
  </div>
</dialog>

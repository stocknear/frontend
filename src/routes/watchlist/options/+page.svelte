<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { onMount } from "svelte";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import Pencil from "lucide-svelte/icons/pencil";
  import DownloadData from "$lib/components/DownloadData.svelte";

  // Lazy load MarkdownNoteEditor
  let MarkdownNoteEditor: any = null;
  let isLoadingEditor = false;

  async function loadMarkdownEditor() {
    if (MarkdownNoteEditor) return;
    isLoadingEditor = true;
    try {
      const module = await import("$lib/components/MarkdownNoteEditor.svelte");
      MarkdownNoteEditor = module.default;
    } finally {
      isLoadingEditor = false;
    }
  }

  // ── Note Caching (LRU, max 100) ──
  const NOTE_CACHE_MAX_SIZE = 100;
  const noteCache = new Map<string, { note: string; timestamp: number }>();
  const noteFetchPromises = new Map<string, Promise<string>>();

  function getNoteFromCache(watchlistId: string, itemId: string): string | null {
    const key = `${watchlistId}:${itemId}`;
    const cached = noteCache.get(key);
    if (cached) {
      noteCache.delete(key);
      noteCache.set(key, cached);
      return cached.note;
    }
    return null;
  }

  function setNoteInCache(watchlistId: string, itemId: string, note: string): void {
    const key = `${watchlistId}:${itemId}`;
    if (noteCache.size >= NOTE_CACHE_MAX_SIZE) {
      const oldestKey = noteCache.keys().next().value;
      if (oldestKey) noteCache.delete(oldestKey);
    }
    noteCache.set(key, { note, timestamp: Date.now() });
  }

  async function fetchNote(watchlistId: string, itemId: string): Promise<string> {
    const key = `${watchlistId}:${itemId}`;
    const existingPromise = noteFetchPromises.get(key);
    if (existingPromise) return existingPromise;

    const cached = getNoteFromCache(watchlistId, itemId);
    if (cached !== null) return cached;

    const fetchPromise = (async () => {
      try {
        const response = await fetch("/api/get-options-watchlist-note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchListId: watchlistId, itemId }),
        });
        if (!response.ok) throw new Error("Failed to fetch note");
        const data = await response.json();
        const note = data.note || "";
        setNoteInCache(watchlistId, itemId, note);
        return note;
      } finally {
        noteFetchPromises.delete(key);
      }
    })();

    noteFetchPromises.set(key, fetchPromise);
    return fetchPromise;
  }

  function prefetchNote(watchlistId: string, itemId: string): void {
    const key = `${watchlistId}:${itemId}`;
    if (!noteCache.has(key) && !noteFetchPromises.has(key)) {
      fetchNote(watchlistId, itemId).catch(() => {});
    }
  }

  // ── Page State ──
  export let data;

  let optionsWatchlist = data?.getOptionsWatchlist;
  let watchList: any[] = [];
  let isLoaded = false;
  let isFullWidth = false;
  let editMode = false;
  let deleteIdList: string[] = [];
  let numberOfChecked = 0;
  let searchQuery = "";

  // Note modal state
  let isLoadingNote = false;
  let isNoteModalOpen = false;
  let editingNoteItemId = "";
  let editingNoteLabel = "";
  let editingNoteText = "";
  let originalNoteText = "";
  $: isNewNote = originalNoteText === "";

  // ── Search / Filter ──
  $: filteredWatchList = searchQuery.length > 0
    ? watchList.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          item?.ticker?.toLowerCase().includes(q) ||
          item?.put_call?.toLowerCase().includes(q) ||
          item?.sentiment?.toLowerCase().includes(q) ||
          item?.option_activity_type?.toLowerCase().includes(q) ||
          item?.execution_estimate?.toLowerCase().includes(q) ||
          item?.option_symbol?.toLowerCase().includes(q) ||
          String(item?.strike_price)?.includes(q)
        );
      })
    : watchList;

  function resetSearch() {
    searchQuery = "";
  }

  function computeDTE(expirationDate: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "";
    return (
      dateString.substring(5, 7) +
      "/" +
      dateString.substring(8, 10) +
      "/" +
      dateString.substring(2, 4)
    );
  }

  function formatTime(timeString: string): string {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  function loadWatchlistData() {
    const items = Array.isArray(optionsWatchlist?.data) ? optionsWatchlist.data : [];
    watchList = items.map((item: any) => ({
      ...item,
      dte: item.date_expiration ? computeDTE(item.date_expiration) : null,
    }));
  }

  // ── Full Width ──
  function toggleFullWidth() {
    isFullWidth = !isFullWidth;
    try {
      localStorage.setItem("watchlist-options-full-width", String(isFullWidth));
    } catch (e) {
      // ignore
    }
  }

  // ── Edit / Delete ──
  function handleEditMode() {
    if (editMode) {
      deleteIdList = [];
      numberOfChecked = 0;
    }
    editMode = !editMode;
  }

  function toggleDeleteItem(id: string) {
    const set = new Set(deleteIdList);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    deleteIdList = Array.from(set);
    numberOfChecked = deleteIdList.length;
  }

  async function handleDeleteItems() {
    if (numberOfChecked === 0) {
      toast.error("Select items to delete", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    // Optimistic UI update
    watchList = watchList.filter((item) => !deleteIdList.includes(item.id));
    editMode = false;

    try {
      const response = await fetch("/api/update-options-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "delete",
          itemIds: deleteIdList,
          id: optionsWatchlist?.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete");

      const result = await response.json();
      optionsWatchlist.data = result.data || [];
      loadWatchlistData();

      toast.success("Removed from watchlist", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } catch (e) {
      toast.error("Failed to delete items", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      // Reload from server state
      loadWatchlistData();
    }

    deleteIdList = [];
    numberOfChecked = 0;
  }

  // ── Notes ──
  async function handleNoteClick(itemId: string, hasNote: boolean, label: string) {
    const watchlistId = optionsWatchlist?.id;
    if (!watchlistId) return;

    editingNoteItemId = itemId;
    editingNoteLabel = label;
    isNoteModalOpen = true;
    isLoadingNote = true;

    try {
      const [, note] = await Promise.all([
        MarkdownNoteEditor ? Promise.resolve() : loadMarkdownEditor(),
        hasNote ? fetchNote(watchlistId, itemId) : Promise.resolve(""),
      ]);
      editingNoteText = note;
      originalNoteText = note;
    } catch (error) {
      editingNoteText = "";
      originalNoteText = "";
      toast.error("Failed to load note", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } finally {
      isLoadingNote = false;
    }
  }

  function handleNoteHover(itemId: string, hasNote: boolean) {
    if (!hasNote || !optionsWatchlist?.id) return;
    prefetchNote(optionsWatchlist.id, itemId);
  }

  async function saveNote(markdown: string) {
    const wasNewNote = isNewNote;
    const watchlistId = optionsWatchlist?.id;
    if (!watchlistId) return;

    try {
      const response = await fetch("/api/update-options-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "note",
          id: watchlistId,
          itemId: editingNoteItemId,
          note: markdown,
        }),
      });

      if (!response.ok) throw new Error("Failed to save note");

      setNoteInCache(watchlistId, editingNoteItemId, markdown);

      // Update hasNote flag locally
      const hasNote = markdown.length > 0;
      watchList = watchList.map((item) => {
        if (item.id === editingNoteItemId) {
          return { ...item, hasNote };
        }
        return item;
      });

      isNoteModalOpen = false;
      toast.success(wasNewNote ? "Note created" : "Note updated", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } catch (error) {
      toast.error("Failed to save note. Please try again.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      throw error;
    }
  }

  function closeNoteModal() {
    isNoteModalOpen = false;
    editingNoteItemId = "";
    editingNoteLabel = "";
    editingNoteText = "";
    originalNoteText = "";
    isLoadingNote = false;
  }

  onMount(() => {
    const savedFullWidth = localStorage?.getItem("watchlist-options-full-width");
    if (savedFullWidth !== null) {
      isFullWidth = savedFullWidth === "true";
    }

    loadWatchlistData();
    isLoaded = true;

    // Preload markdown editor during idle time
    const preloadEditor = () => {
      if (!MarkdownNoteEditor && !isLoadingEditor) {
        loadMarkdownEditor();
      }
    };
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(preloadEditor, { timeout: 3000 });
    } else {
      setTimeout(preloadEditor, 2000);
    }
  });
</script>

<SEO
  title="Options Watchlist - stocknear"
  description="Track your saved options flow trades. Monitor premium, sentiment, and contract details in one place."
  keywords="options watchlist, options flow tracker, saved options trades, options premium tracker"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Options Watchlist",
    description: "Track your saved options flow trades in one place.",
    url: "https://stocknear.com/watchlist/options",
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
          name: "Watchlist",
          item: "https://stocknear.com/watchlist",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Options",
          item: "https://stocknear.com/watchlist/options",
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
  class="w-full overflow-hidden min-h-screen pt-5 pb-40 px-3 text-gray-700 dark:text-zinc-200 transition-all duration-300 {isFullWidth ? 'max-w-full' : 'max-w-3xl sm:max-w-[1400px]'}"
>
  <BreadCrumb containerClass="text-sm sm:text-[1rem] breadcrumbs">
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 transition"
      >
        Home
      </a>
    </li>
    <li>
      <a
        href="/watchlist/stocks"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 transition"
      >
        Watchlist
      </a>
    </li>
    <li class="text-gray-500 dark:text-zinc-400">Options</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <h1
            class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
          >
            Options Watchlist
          </h1>

          {#if isLoaded}
            <!-- Toolbar -->
            {#if data?.user?.tier === "Pro" && watchList.length > 0}
              <div
                class="flex w-full sm:w-[50%] md:w-auto mb-5 border-t border-b border-gray-300 dark:border-zinc-700 py-2"
              >
                <div
                  class="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-0 sm:flex sm:flex-row sm:items-center"
                >
                  <!-- Trade Count -->
                  <div class="order-0 w-full sm:w-fit">
                    <span
                      class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap"
                    >
                      {watchList.length} Trade{watchList.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <!-- Search Input -->
                  <div class="order-2 sm:order-1 w-full">
                    <div class="relative sm:ml-3 w-full">
                      <div
                        class="inline-block cursor-pointer absolute right-2 top-2 text-sm"
                      >
                        {#if searchQuery?.length > 0}
                          <label
                            class="cursor-pointer"
                            on:click={resetSearch}
                          >
                            <svg
                              class="w-5 h-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                              />
                            </svg>
                          </label>
                        {/if}
                      </div>
                      <input
                        bind:value={searchQuery}
                        type="text"
                        placeholder="Find..."
                        class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
                      />
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div
                    class="order-1 sm:order-last w-full sm:w-fit flex justify-end sm:ml-3"
                  >
                    <div class="flex flex-row items-center justify-end w-full">
                      {#if editMode}
                        <label
                          on:click={handleDeleteItems}
                          class="w-full border text-sm border-gray-300 dark:border-zinc-700 mr-2 sm:ml-3 sm:mr-0 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full py-1.5 pl-3 pr-4 font-semibold bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-rose-800 dark:hover:text-rose-400"
                        >
                          <svg
                            class="inline-block w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            ><path
                              fill="currentColor"
                              d="M10 5h4a2 2 0 1 0-4 0M8.5 5a3.5 3.5 0 1 1 7 0h5.75a.75.75 0 0 1 0 1.5h-1.32l-1.17 12.111A3.75 3.75 0 0 1 15.026 22H8.974a3.75 3.75 0 0 1-3.733-3.389L4.07 6.5H2.75a.75.75 0 0 1 0-1.5zm2 4.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0zM14.25 9a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75m-7.516 9.467a2.25 2.25 0 0 0 2.24 2.033h6.052a2.25 2.25 0 0 0 2.24-2.033L18.424 6.5H5.576z"
                            /></svg
                          >
                          <span class="ml-1 text-sm">
                            {numberOfChecked}
                          </span>
                        </label>
                      {/if}

                      <!-- Edit Watchlist Button -->
                      <label
                        on:click={handleEditMode}
                        class="w-full border text-sm border-gray-300 dark:border-zinc-700 sm:ml-3 cursor-pointer inline-flex items-center justify-start space-x-1 whitespace-nowrap rounded-full py-2 px-3 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-800 dark:hover:text-violet-400"
                      >
                        <svg
                          class="inline-block w-5 h-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1024 1024"
                          ><path
                            fill="currentColor"
                            d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"
                          /><path
                            fill="currentColor"
                            d="m469.952 554.24l52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
                          /></svg
                        >
                        {#if !editMode}
                          <span class="ml-1 text-[0.85rem] sm:text-sm">
                            Edit Watchlist
                          </span>
                        {:else}
                          <span class="ml-1 text-[0.85rem] sm:text-sm">
                            Cancel
                          </span>
                        {/if}
                      </label>

                      <!-- Download Button -->
                      <div class="ml-2 sm:ml-3">
                        <DownloadData
                          {data}
                          rawData={filteredWatchList}
                          title="options-watchlist"
                          bulkDownload={false}
                        />
                      </div>

                      <!-- Full Width Toggle (3xl+ only) -->
                      <button
                        on:click={toggleFullWidth}
                        title={isFullWidth
                          ? "Exit Full Width"
                          : "Expand Full Width"}
                        class="ml-3 hidden 3xl:flex cursor-pointer w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-violet-800 dark:hover:text-violet-400 flex-row items-center px-3 py-2 rounded-full gap-2 {isFullWidth
                          ? 'border-violet-400 dark:border-violet-500'
                          : ''}"
                      >
                        {#if isFullWidth}
                          <svg
                            class="w-4 h-4 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <polyline points="4 14 10 14 10 20" />
                            <polyline points="20 10 14 10 14 4" />
                            <line x1="14" y1="10" x2="21" y2="3" />
                            <line x1="3" y1="21" x2="10" y2="14" />
                          </svg>
                        {:else}
                          <svg
                            class="w-4 h-4 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <polyline points="15 3 21 3 21 9" />
                            <polyline points="9 21 3 21 3 15" />
                            <line x1="21" y1="3" x2="14" y2="10" />
                            <line x1="3" y1="21" x2="10" y2="14" />
                          </svg>
                        {/if}
                        <span class="truncate text-[0.85rem] sm:text-sm"
                          >{isFullWidth ? "Normal Width" : "Full Width"}</span
                        >
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Empty States -->
            {#if !data?.user}
              <div
                class="flex flex-col justify-center items-center m-auto z-0 pt-16"
              >
                <span class="font-bold text-xl sm:text-3xl">
                  Your Options Watchlist
                </span>
                <span class="text-sm sm:text-lg m-auto p-4 text-center">
                  Sign in and save options flow trades to track them here.
                </span>
                <a
                  class="w-64 flex mt-3 py-2 rounded-full justify-center items-center m-auto border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 transition duration-150 ease-in-out"
                  href="/register"
                >
                  Get Started
                </a>
              </div>
            {:else if data?.user?.tier !== "Pro"}
              <div
                class="flex flex-col justify-center items-center m-auto z-0 pt-16"
              >
                <span class="font-bold text-xl sm:text-3xl">
                  Options Watchlist
                </span>
                <span class="text-sm sm:text-lg m-auto p-4 text-center">
                  Upgrade to Pro to save and track options flow trades.
                </span>
                <a
                  class="w-64 flex mt-3 py-2 rounded-full justify-center items-center m-auto border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 transition duration-150 ease-in-out"
                  href="/pricing"
                >
                  Upgrade to Pro
                </a>
              </div>
            {:else if watchList.length === 0}
              <div
                class="flex flex-col justify-center items-center m-auto z-0 pt-16"
              >
                <span class="font-bold text-xl sm:text-3xl">
                  No Saved Trades
                </span>
                <span class="text-sm sm:text-lg m-auto p-4 text-center">
                  Save trades from the Options Flow page using the star icon.
                </span>
                <a
                  class="w-64 flex mt-3 py-2 rounded-full justify-center items-center m-auto border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 transition duration-150 ease-in-out group"
                  href="/options-flow"
                >
                  Go to Options Flow
                  <span
                    class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out"
                  >
                    <svg
                      class="ml-1 size-5 text-white dark:text-gray-900"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </span>
                </a>
              </div>
            {:else}
              <!-- Options Watchlist Table -->
              <div
                class="w-full m-auto mb-4 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto relative"
              >
                <table
                  class="table table-sm table-compact rounded-none sm:rounded w-full m-auto text-gray-700 dark:text-zinc-200 tabular-nums"
                >
                  <thead>
                    <tr
                      class="bg-white/60 dark:bg-zinc-950/40 text-gray-500 dark:text-zinc-400 font-semibold text-[11px] uppercase tracking-wide border-b border-gray-300 dark:border-zinc-700"
                    >
                      {#if editMode}
                        <th class="p-2 text-center w-8"></th>
                      {/if}
                      <th class="p-2 text-right">Time</th>
                      <th class="p-2 text-left">Symbol</th>
                      <th class="p-2 text-center w-8"></th>
                      <th class="p-2 text-right">C/P</th>
                      <th class="p-2 text-right">Strike</th>
                      <th class="p-2 text-right">Expiry</th>
                      <th class="p-2 text-right">DTE</th>
                      <th class="p-2 text-right">Sent.</th>
                      <th class="p-2 text-right">Spot</th>
                      <th class="p-2 text-right">Price</th>
                      <th class="p-2 text-right">Prem</th>
                      <th class="p-2 text-right">Type</th>
                      <th class="p-2 text-right">Exec</th>
                      <th class="p-2 text-right">Size</th>
                    </tr>
                  </thead>
                  <tbody
                    class="divide-y divide-gray-200/70 dark:divide-zinc-800/80"
                  >
                    {#each filteredWatchList as item}
                      <tr
                        class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
                      >
                        {#if editMode}
                          <td class="text-center">
                            <input
                              type="checkbox"
                              checked={deleteIdList.includes(item.id)}
                              on:click={() => toggleDeleteItem(item.id)}
                              class="h-4 w-4 rounded border cursor-pointer"
                            />
                          </td>
                        {/if}
                        <td
                          class="text-end text-sm whitespace-nowrap text-gray-500 dark:text-zinc-400"
                        >
                          {formatTime(item?.time)} · {formatDate(item?.date)}
                        </td>
                        <td
                          on:click|stopPropagation
                          class="text-left text-sm whitespace-nowrap"
                        >
                          <HoverStockChart
                            symbol={item?.ticker}
                            assetType={item?.underlying_type}
                            optionSymbol={item?.option_symbol}
                          />
                        </td>
                        <td class="text-center whitespace-nowrap">
                          <button
                            on:click|stopPropagation={() =>
                              handleNoteClick(
                                item.id,
                                item?.hasNote || false,
                                `${item?.ticker} ${item?.strike_price} ${item?.put_call}`,
                              )}
                            on:mouseenter={() =>
                              handleNoteHover(item.id, item?.hasNote || false)}
                            class="cursor-pointer transition-colors"
                            title={item?.hasNote ? "Edit note" : "Add note"}
                          >
                            <Pencil
                              class="h-3.5 w-3.5 {item?.hasNote
                                ? 'text-violet-500 dark:text-violet-400'
                                : 'text-gray-400 dark:text-zinc-500'}"
                            />
                          </button>
                        </td>
                        <td
                          class="text-end text-sm whitespace-nowrap {item?.put_call === 'Calls'
                            ? 'text-emerald-800 dark:text-emerald-400'
                            : 'text-rose-800 dark:text-rose-400'}"
                        >
                          {item?.put_call}
                        </td>
                        <td class="text-end text-sm whitespace-nowrap">
                          {item?.strike_price}
                        </td>
                        <td class="text-end text-sm whitespace-nowrap">
                          {formatDate(item?.date_expiration)}
                        </td>
                        <td class="text-end text-sm whitespace-nowrap">
                          {#if item?.dte === null}
                            -
                          {:else if item.dte < 0}
                            <span class="text-gray-400 dark:text-zinc-500"
                              >expired</span
                            >
                          {:else}
                            {item.dte}d
                          {/if}
                        </td>
                        <td
                          class="text-end text-sm whitespace-nowrap {item?.sentiment ===
                          'Bullish'
                            ? 'text-emerald-800 dark:text-emerald-400'
                            : item?.sentiment === 'Bearish'
                              ? 'text-rose-800 dark:text-rose-400'
                              : 'text-orange-800 dark:text-[#C6A755]'}"
                        >
                          {item?.sentiment}
                        </td>
                        <td class="text-end text-sm whitespace-nowrap">
                          {item?.underlying_price}
                        </td>
                        <td class="text-end text-sm whitespace-nowrap">
                          {item?.price}
                        </td>
                        <td class="text-end text-sm whitespace-nowrap">
                          {@html abbreviateNumber(
                            item?.cost_basis,
                            false,
                            true,
                          )}
                        </td>
                        <td
                          class="text-end text-sm whitespace-nowrap {item?.option_activity_type ===
                          'Sweep'
                            ? 'text-gray-600 dark:text-[#C6A755]'
                            : item?.option_activity_type === 'Block'
                              ? 'text-gray-600 dark:text-[#FF6B6B]'
                              : item?.option_activity_type === 'Large'
                                ? 'text-gray-600 dark:text-[#4ECDC4]'
                                : 'text-gray-600 dark:text-[#976DB7]'}"
                        >
                          {item?.option_activity_type}
                        </td>
                        <td
                          class="text-end text-sm whitespace-nowrap {[
                            'At Ask',
                            'Above Ask',
                          ].includes(item?.execution_estimate)
                            ? 'text-gray-600 dark:text-[#C8A32D]'
                            : ['At Bid', 'Below Bid'].includes(
                                  item?.execution_estimate,
                                )
                              ? 'text-gray-600 dark:text-[#8F82FE]'
                              : 'text-gray-600 dark:text-[#A98184]'}"
                        >
                          {item?.execution_estimate?.replace("Midpoint", "Mid")}
                        </td>
                        <td
                          class="text-end text-sm whitespace-nowrap tabular-nums"
                        >
                          {new Intl.NumberFormat("en", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(item?.size)}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          {:else}
            <!-- Loading State -->
            <div class="flex justify-center items-center pt-20">
              <span
                class="loading loading-spinner loading-lg text-gray-400"
              ></span>
            </div>
          {/if}
        </main>
      </div>
    </div>
  </div>
</section>

<!-- Note Modal -->
<input
  type="checkbox"
  id="optionsNoteModal"
  class="modal-toggle"
  bind:checked={isNoteModalOpen}
/>

<dialog id="optionsNoteModal" class="modal modal-bottom sm:modal-middle">
  <label
    class="cursor-pointer modal-backdrop bg-black/50"
    on:click={closeNoteModal}
  ></label>

  <div
    class="modal-box w-full overflow-hidden max-w-3xl p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    {#if isNoteModalOpen}
      {#if isLoadingEditor || isLoadingNote || !MarkdownNoteEditor}
        <label
          class="shadow bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <span
            class="loading loading-spinner loading-md text-white dark:text-white"
          ></span>
        </label>
      {:else}
        <svelte:component
          this={MarkdownNoteEditor}
          value={editingNoteText}
          symbol={editingNoteLabel}
          {isNewNote}
          onSave={saveNote}
          onCancel={closeNoteModal}
        />
      {/if}
    {/if}
  </div>
</dialog>

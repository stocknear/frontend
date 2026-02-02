<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { Combobox } from "bits-ui";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { isOpen } from "$lib/store";
  import { calculateChange } from "$lib/utils";

  export let currentSymbol: string | null = null;
  export let wsURL: string | null = null;

  type WatchlistSummary = {
    id: string;
    title?: string;
    ticker?: unknown;
  };

  type WatchlistItem = {
    symbol?: string;
    name?: string;
    price?: number | string | null;
    changesPercentage?: number | string | null;
    volume?: number | string | null;
    type?: string;
    previous?: number | null;
  };

  type WatchlistGroup = {
    key: string;
    label: string;
    items: WatchlistItem[];
  };

  type SidebarTab = "watchlist" | "alerts";

  const WATCHLIST_STORAGE_KEY = "last-watchlist-id";
  const WATCHLIST_ID_REGEX = /^[a-zA-Z0-9]{15}$/;

  const groupOrder = [
    "indices",
    "stocks",
    "etfs",
    "crypto",
    "forex",
    "futures",
    "watchlist",
  ];

  const groupLabels: Record<string, string> = {
    indices: "Indices",
    stocks: "Stocks",
    etfs: "ETFs",
    crypto: "Crypto",
    forex: "Forex",
    futures: "Futures",
    watchlist: "Watchlist",
  };

  let watchlists: WatchlistSummary[] = [];
  let activeWatchlistId: string | null = null;
  let activeWatchlistTitle = "Create Watchlist";
  let watchlistItems: WatchlistItem[] = [];
  export let activeTab: SidebarTab = "watchlist";
  let isLoadingWatchlists = false;
  let isLoadingItems = false;
  let isLoading = false;
  let errorMessage = "";
  let headerTitle = "Watchlist";

  let watchlistsController: AbortController | null = null;
  let itemsController: AbortController | null = null;

  // Search state
  let searchInputValue = "";
  let searchBarData: Array<{ symbol: string; name: string; type: string }> = [];
  let searchTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let isAddingTicker = false;
  let touchedInput = false;

  // Collapsible groups state
  let collapsedGroups: Set<string> = new Set();
  const COLLAPSED_GROUPS_KEY = "watchlist-collapsed-groups";

  // Edit mode state for deleting tickers
  let editMode = false;
  let deleteTickerList: string[] = [];
  let numberOfChecked = 0;

  // Create watchlist modal state
  let isCreateModalOpen = false;
  let newWatchlistTitle = "";
  let isCreatingWatchlist = false;

  // Delete watchlist modal state
  let isDeleteModalOpen = false;
  let watchlistToDelete: WatchlistSummary | null = null;
  let isDeletingWatchlist = false;

  // WebSocket state for real-time price updates
  let socket: WebSocket | null = null;
  let lastSubscribedSymbols: string[] = [];

  // Pagination state
  let currentPage = 1;
  let itemsPerPage = 20;
  let totalPages = 1;
  let paginatedItems: WatchlistItem[] = [];

  $: isLoading = isLoadingWatchlists || isLoadingItems;
  $: headerTitle =
    activeTab === "alerts" ? "Price alerts" : activeWatchlistTitle;

  const numberFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const percentFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const toNumber = (value: unknown): number | null => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string") {
      const cleaned = value.replace(/[%,$]/g, "");
      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const isValidWatchlistId = (value: unknown): value is string =>
    typeof value === "string" && WATCHLIST_ID_REGEX.test(value);

  const formatPrice = (value: unknown) => {
    const numeric = toNumber(value);
    return numeric === null ? "-" : numberFormatter.format(numeric);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "-";
    const sign = value > 0 ? "+" : "";
    return `${sign}${percentFormatter.format(value)}%`;
  };

  const formatVolume = (value: unknown): string => {
    const numeric = toNumber(value);
    if (numeric === null) return "-";
    if (numeric >= 1_000_000_000) {
      return `${(numeric / 1_000_000_000).toFixed(1)}B`;
    }
    if (numeric >= 1_000_000) {
      return `${(numeric / 1_000_000).toFixed(1)}M`;
    }
    if (numeric >= 1_000) {
      return `${(numeric / 1_000).toFixed(1)}K`;
    }
    return numeric.toString();
  };

  const getChangeClass = (value: number | null) => {
    if (value === null) return "text-gray-400 dark:text-zinc-500";
    return value >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";
  };

  const normalizeGroupKey = (type: unknown): string => {
    const key = String(type ?? "").toLowerCase();
    if (["index", "indices"].includes(key)) return "indices";
    if (["stock", "stocks"].includes(key)) return "stocks";
    if (["etf", "etfs"].includes(key)) return "etfs";
    if (["crypto", "cryptocurrency"].includes(key)) return "crypto";
    if (["forex", "fx"].includes(key)) return "forex";
    if (["future", "futures", "commodity", "commodities"].includes(key))
      return "futures";
    return "watchlist";
  };

  const buildGroups = (items: WatchlistItem[]): WatchlistGroup[] => {
    if (!items.length) return [];
    const grouped = new Map<string, WatchlistItem[]>();
    items.forEach((item) => {
      const key = normalizeGroupKey(item?.type);
      const bucket = grouped.get(key);
      if (bucket) {
        bucket.push(item);
      } else {
        grouped.set(key, [item]);
      }
    });

    const groups = groupOrder
      .filter((key) => grouped.has(key))
      .map((key) => ({
        key,
        label: groupLabels[key] ?? "Watchlist",
        items: grouped.get(key) ?? [],
      }));

    if (groups.length <= 1) {
      return [
        {
          key: "watchlist",
          label: "",
          items: items,
        },
      ];
    }

    return groups;
  };

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    paginatedItems = watchlistItems.slice(startIndex, endIndex);
    totalPages = Math.max(1, Math.ceil(watchlistItems.length / itemsPerPage));
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      updatePaginatedData();
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      updatePaginatedData();
    }
  }

  // Update pagination when watchlistItems changes
  $: if (watchlistItems.length > 0) {
    const maxPage = Math.ceil(watchlistItems.length / itemsPerPage);
    if (currentPage > maxPage) {
      currentPage = 1;
    }
    updatePaginatedData();
  } else {
    paginatedItems = [];
    totalPages = 1;
  }

  // Build groups from paginated items
  $: groupedItems = buildGroups(paginatedItems);

  const safeParse = (value: string | null) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const getActiveSymbol = () => currentSymbol?.toUpperCase() ?? "";

  const isActiveSymbol = (symbol: string | undefined) =>
    Boolean(symbol) && symbol?.toUpperCase() === getActiveSymbol();

  const navigateToSymbol = (symbol: string | undefined) => {
    if (!symbol || !/^[A-Za-z0-9.^-]{1,20}$/.test(symbol)) return;
    const normalized = symbol.toUpperCase();
    goto(`/chart/${encodeURIComponent(normalized)}`);
  };

  const updateLocalStorageWatchlist = (id: string) => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(id));
    } catch {
      // ignore
    }
  };

  const resetWatchlistsController = () => {
    if (watchlistsController) {
      watchlistsController.abort();
    }
    watchlistsController = new AbortController();
    return watchlistsController.signal;
  };

  const resetItemsController = () => {
    if (itemsController) {
      itemsController.abort();
    }
    itemsController = new AbortController();
    return itemsController.signal;
  };

  const loadWatchlistItems = async (watchListId: string) => {
    if (!isValidWatchlistId(watchListId)) {
      watchlistItems = [];
      return;
    }
    const signal = resetItemsController();
    isLoadingItems = true;
    errorMessage = "";
    currentPage = 1; // Reset pagination when loading new watchlist

    try {
      const response = await fetch("/api/get-watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          watchListId,
          ruleOfList: ["price", "changesPercentage", "volume"],
        }),
        signal,
      });

      const output = await response.json();
      const rawList = Array.isArray(output?.data)
        ? output.data
        : Array.isArray(output)
          ? output?.[0]
          : [];

      watchlistItems = Array.isArray(rawList) ? rawList : [];
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        errorMessage = "Unable to load watchlist.";
        watchlistItems = [];
      }
    } finally {
      if (!signal.aborted) {
        isLoadingItems = false;
      }
    }
  };

  const loadWatchlists = async () => {
    const signal = resetWatchlistsController();
    isLoadingWatchlists = true;
    errorMessage = "";

    try {
      const response = await fetch("/api/all-watchlists", { signal });
      const output = await response.json();
      watchlists = Array.isArray(output) ? output : [];

      const savedId = safeParse(localStorage?.getItem(WATCHLIST_STORAGE_KEY));
      const selected = watchlists.find((item) => item?.id === savedId);
      const fallback = selected ?? watchlists[0];

      activeWatchlistId = fallback?.id ?? null;
      activeWatchlistTitle = fallback?.title ?? "Create Watchlist";

      if (activeWatchlistId) {
        updateLocalStorageWatchlist(activeWatchlistId);
        await loadWatchlistItems(activeWatchlistId);
      } else {
        watchlistItems = [];
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        errorMessage = "Unable to load watchlists.";
        watchlists = [];
        watchlistItems = [];
      }
    } finally {
      if (!signal.aborted) {
        isLoadingWatchlists = false;
      }
    }
  };

  const handleWatchlistChange = async () => {
    if (!activeWatchlistId) return;
    const selected = watchlists.find((item) => item?.id === activeWatchlistId);
    activeWatchlistTitle = selected?.title ?? "Watchlist";
    updateLocalStorageWatchlist(activeWatchlistId);
    await loadWatchlistItems(activeWatchlistId);
  };

  // Search stocks function
  const searchStocks = async () => {
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    if (!searchInputValue.trim()) {
      searchBarData = [];
      return;
    }

    searchTimeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(searchInputValue)}&limit=10`,
        );
        searchBarData = await response.json();
      } catch {
        searchBarData = [];
      }
    }, 50);
  };

  // Add ticker function
  const handleAddTicker = async (ticker: string) => {
    if (isAddingTicker || !activeWatchlistId) return;
    if (watchlistItems.some((item) => item?.symbol === ticker)) {
      toast.error("Already in watchlist", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      searchInputValue = "";
      searchBarData = [];
      return;
    }

    isAddingTicker = true;
    searchInputValue = "";
    searchBarData = [];

    try {
      const promise = fetch("/api/update-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, watchListId: activeWatchlistId }),
      }).then(async (res) => {
        const output = await res.json();
        if (!res.ok) throw new Error(output.error || "Failed to add ticker");
        return output;
      });

      toast.promise(promise, {
        loading: "Updating...",
        success: "Updated!",
        error: (e: Error) => e.message || "Failed to add ticker",
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });

      const updatedData = await promise;

      // Update the local watchlists array with updated ticker data
      watchlists = watchlists.map((item) => {
        if (item.id === activeWatchlistId) {
          return { ...item, ticker: updatedData.ticker };
        }
        return item;
      });

      await loadWatchlistItems(activeWatchlistId);
    } finally {
      isAddingTicker = false;
    }
  };

  // Edit mode functions for deleting tickers
  function handleEditMode() {
    if (editMode === true) {
      deleteTickerList = [];
      numberOfChecked = 0;
    }
    editMode = !editMode;
  }

  function handleFilter(symbol: string) {
    const filterSet = new Set(deleteTickerList);
    if (filterSet.has(symbol)) {
      filterSet.delete(symbol);
    } else {
      filterSet.add(symbol);
    }
    deleteTickerList = Array.from(filterSet);
    numberOfChecked = deleteTickerList.length;
  }

  async function handleDeleteTickers() {
    if (numberOfChecked === 0) {
      toast.error("Please select symbols to delete", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    if (!activeWatchlistId) return;

    // Update local state immediately
    watchlistItems = watchlistItems.filter(
      (item) => !deleteTickerList.includes(item?.symbol ?? ""),
    );

    editMode = false;
    const postData = {
      ticker: watchlistItems.map((item) => item?.symbol),
      watchListId: activeWatchlistId,
      mode: "delete",
    };

    try {
      const response = await fetch("/api/update-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error("Failed to remove tickers");
      }

      // Update local watchlists array
      watchlists = watchlists.map((item) => {
        if (item.id === activeWatchlistId) {
          return { ...item, ticker: watchlistItems };
        }
        return item;
      });

      deleteTickerList = [];
      numberOfChecked = 0;

      // Refresh watchlist items to ensure sync
      await loadWatchlistItems(activeWatchlistId);
    } catch {
      // Reload items on error to restore state
      await loadWatchlistItems(activeWatchlistId);
      toast.error("Failed to remove tickers", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }

  // Collapsible groups functions
  const toggleGroupCollapse = (groupKey: string) => {
    if (collapsedGroups.has(groupKey)) {
      collapsedGroups.delete(groupKey);
    } else {
      collapsedGroups.add(groupKey);
    }
    collapsedGroups = new Set(collapsedGroups);
    try {
      localStorage.setItem(
        COLLAPSED_GROUPS_KEY,
        JSON.stringify([...collapsedGroups]),
      );
    } catch {
      // ignore
    }
  };

  const loadCollapsedGroups = () => {
    try {
      const saved = localStorage.getItem(COLLAPSED_GROUPS_KEY);
      if (saved) {
        collapsedGroups = new Set(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  };

  // Create watchlist function
  const handleCreateWatchlist = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!newWatchlistTitle.trim()) {
      toast.error("Please enter a watchlist name", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }
    if (newWatchlistTitle.length > 100) {
      toast.error("Watchlist name is too long", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    isCreatingWatchlist = true;

    try {
      // Security: Don't send user ID from client - server uses authenticated session
      const promise = fetch("/api/create-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newWatchlistTitle,
          ticker: [],
        }),
      }).then(async (res) => {
        const output = await res.json();
        if (!res.ok)
          throw new Error(output.error || "Failed to create watchlist");
        return output;
      });

      toast.promise(promise, {
        loading: "Creating...",
        success: "Watchlist created!",
        error: (e: Error) => e.message || "Failed to create watchlist",
      });

      const output = await promise;

      // Add new watchlist with proper structure
      const newWatchlist: WatchlistSummary = {
        id: output.id,
        title: output.title ?? newWatchlistTitle,
        ticker: [],
      };
      watchlists = [...watchlists, newWatchlist];
      activeWatchlistId = output.id;
      activeWatchlistTitle = newWatchlist.title ?? "Watchlist";
      updateLocalStorageWatchlist(output.id);
      watchlistItems = [];
      isCreateModalOpen = false;
      newWatchlistTitle = "";
    } finally {
      isCreatingWatchlist = false;
    }
  };

  // Open delete watchlist modal
  const openDeleteModal = (watchlist: WatchlistSummary) => {
    watchlistToDelete = watchlist;
    isDeleteModalOpen = true;
  };

  // Delete watchlist function
  const handleDeleteWatchlist = async () => {
    if (!watchlistToDelete?.id) return;

    isDeletingWatchlist = true;

    try {
      const response = await fetch("/api/delete-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchListId: watchlistToDelete.id }),
      });

      const output = await response.json();

      if (output === "success") {
        toast.success("Watchlist deleted", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });

        // Remove deleted watchlist from array
        watchlists = watchlists.filter(
          (item) => item.id !== watchlistToDelete?.id,
        );

        // If the deleted watchlist was active, switch to the first remaining one
        if (activeWatchlistId === watchlistToDelete.id) {
          const fallback = watchlists[0];
          activeWatchlistId = fallback?.id ?? null;
          activeWatchlistTitle = fallback?.title ?? "Watchlist";
          if (activeWatchlistId) {
            updateLocalStorageWatchlist(activeWatchlistId);
            await loadWatchlistItems(activeWatchlistId);
          } else {
            watchlistItems = [];
          }
        }

        isDeleteModalOpen = false;
        watchlistToDelete = null;
      } else {
        toast.error("Failed to delete watchlist", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      }
    } catch (error) {
      console.error("Error deleting watchlist:", error);
      toast.error("Something went wrong. Please try again.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } finally {
      isDeletingWatchlist = false;
    }
  };

  // Logo URL helper
  const getLogoUrl = (symbol: string | undefined): string =>
    symbol
      ? `https://financialmodelingprep.com/image-stock/${symbol.toUpperCase()}.png`
      : "";

  // WebSocket functions for real-time price updates
  function sendWsMessage(message: string[]) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  function connectWebSocket() {
    if (!wsURL || !$isOpen || paginatedItems.length === 0) return;
    if (
      socket &&
      (socket.readyState === WebSocket.CONNECTING ||
        socket.readyState === WebSocket.OPEN)
    ) {
      // Already connected, just update subscription if needed
      const currentSymbols = paginatedItems
        .map((item) => item.symbol)
        .filter(Boolean) as string[];
      const symbolsChanged =
        JSON.stringify(currentSymbols.sort()) !==
        JSON.stringify(lastSubscribedSymbols.sort());
      if (symbolsChanged && socket.readyState === WebSocket.OPEN) {
        lastSubscribedSymbols = currentSymbols;
        sendWsMessage(currentSymbols);
      }
      return;
    }

    try {
      socket = new WebSocket(wsURL + "/price-data");

      socket.addEventListener("open", () => {
        // Only subscribe to paginated (visible) items
        const tickerList = paginatedItems
          .map((item) => item.symbol)
          .filter(Boolean) as string[];
        if (tickerList.length > 0) {
          lastSubscribedSymbols = tickerList;
          sendWsMessage(tickerList);
        }
      });

      socket.addEventListener("message", (event) => {
        try {
          const newList = JSON.parse(event.data);
          if (Array.isArray(newList) && newList.length > 0) {
            watchlistItems = calculateChange(watchlistItems, newList);
            // Clear previous after flash animation
            setTimeout(() => {
              watchlistItems = watchlistItems.map((item) => ({
                ...item,
                previous: null,
              }));
            }, 800);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      });

      socket.addEventListener("close", () => {
        // Connection closed - will reconnect via reactive statement if needed
      });
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }

  function disconnectWebSocket() {
    if (socket) {
      socket.close();
      socket = null;
      lastSubscribedSymbols = [];
    }
  }

  // Reactive: Connect/disconnect WebSocket based on market status
  $: if ($isOpen && wsURL && paginatedItems.length > 0 && activeTab === "watchlist") {
    connectWebSocket();
  } else if (!$isOpen || activeTab !== "watchlist") {
    disconnectWebSocket();
  }

  // Update WebSocket subscription when page changes
  $: if (socket && socket.readyState === WebSocket.OPEN && paginatedItems.length > 0) {
    const tickerList = paginatedItems.map((item) => item.symbol).filter(Boolean) as string[];
    const symbolsChanged =
      JSON.stringify(tickerList.sort()) !== JSON.stringify(lastSubscribedSymbols.sort());
    if (symbolsChanged) {
      lastSubscribedSymbols = tickerList;
      sendWsMessage(tickerList);
    }
  }

  onMount(() => {
    loadCollapsedGroups();
    loadWatchlists();
  });

  onDestroy(() => {
    disconnectWebSocket();
    if (watchlistsController) {
      watchlistsController.abort();
      watchlistsController = null;
    }
    if (itemsController) {
      itemsController.abort();
      itemsController = null;
    }
  });
</script>

<div
  class="tv-right-panel flex h-full flex-1 flex-col bg-white dark:bg-[#0b0b0d]"
>
  <!-- Header title row -->
  <div
    class="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-200 dark:border-zinc-800 text-[11px] font-semibold text-gray-800 dark:text-zinc-200"
  >
    {#if activeTab === "alerts"}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="size-4"
        viewBox="0 0 24 24"
      >
        <g
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        >
          <path d="M3 5.231L6.15 3M21 5.231L17.85 3" />
          <circle cx="12" cy="13" r="8" />
          <path d="M9.5 13h5M12 10.5v5" />
        </g>
      </svg>
      <span class="text-sm">Price alerts</span>
    {:else}
      <svg
        class="size-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        />
      </svg>
      <span class="text-sm">Watchlist</span>
    {/if}
  </div>

  <!-- Watchlist dropdown selector -->
  {#if activeTab === "watchlist"}
    <div class="px-3 py-0 border-b border-gray-200 dark:border-zinc-800">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <Button
            builders={[builder]}
            class="w-fit transition-all px-1 py-0 duration-150 text-gray-900 dark:text-zinc-200 bg-white/80 dark:bg-[#0b0b0d]  flex flex-row justify-between items-center truncate text-xs"
          >
            <span class="truncate font-medium">{activeWatchlistTitle}</span>
            <svg
              class="-mr-1 ml-1 h-4 w-4 inline-block"
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
          align="start"
          sideOffset={10}
          alignOffset={0}
          class="w-56 h-fit max-h-72 overflow-y-auto scroller rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 z-50"
        >
          <DropdownMenu.Item
            on:click={() => (isCreateModalOpen = true)}
            class="flex flex-row items-center cursor-pointer hover:text-violet-800 dark:hover:text-violet-400 transition text-sm text-gray-700 dark:text-zinc-200"
          >
            <svg
              class="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
              style="max-width:40px"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <span class="text-sm">New Watchlist</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            {#each watchlists as list}
              <DropdownMenu.Item
                on:click={() => {
                  activeWatchlistId = list.id;
                  handleWatchlistChange();
                }}
                class="text-sm cursor-pointer {list.id === activeWatchlistId
                  ? 'text-violet-800 dark:text-violet-400'
                  : 'text-gray-600 dark:text-zinc-300 sm:hover:text-violet-800 dark:sm:hover:text-violet-400'}"
              >
                {list.title ?? "Watchlist"} ({Array.isArray(list.ticker)
                  ? list.ticker.length
                  : 0})
                <label
                  class="ml-auto inline-block cursor-pointer sm:hover:text-rose-800 dark:sm:hover:text-rose-400 transition"
                  on:click|stopPropagation={() => openDeleteModal(list)}
                >
                  <svg
                    class="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                    style="max-width:40px"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </label>
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
          {#if watchlists.length === 0}
            <div class="px-3 py-2 text-sm text-gray-500 dark:text-zinc-400">
              No watchlists yet
            </div>
          {/if}
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            on:click={() => goto("/watchlist/stocks")}
            class="flex items-center gap-2 text-xs cursor-pointer text-gray-600 dark:text-zinc-300 sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
          >
            <svg
              class="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
            Manage Watchlists
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  {/if}

  <!-- Add stocks search input and Edit button in same row -->
  {#if activeTab === "watchlist" && activeWatchlistId}
    <div
      class="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-zinc-800"
    >
      <!-- Add stocks input -->
      <div class="flex-1">
        <Combobox.Root
          items={searchBarData}
          bind:inputValue={searchInputValue}
          bind:touchedInput
        >
          <div class="relative w-full">
            <Combobox.Input
              on:input={searchStocks}
              class="py-1.5 text-xs border bg-white/80 dark:bg-zinc-950/60 border-gray-300 dark:border-zinc-700 rounded-full placeholder:text-gray-500 dark:placeholder:text-zinc-400 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 w-full"
              placeholder="Add stocks..."
              aria-label="Add stocks"
            />
          </div>

          <Combobox.Content
            class="w-auto z-50 rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 px-1 py-1.5 outline-hidden"
            sideOffset={8}
          >
            {#if searchInputValue?.length > 0}
              {#each searchBarData as item}
                <Combobox.Item
                  class="cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-button py-1.5 pl-3 pr-1.5 text-xs capitalize outline-hidden transition-all duration-75 data-[highlighted]:text-violet-800 dark:data-[highlighted]:text-violet-400"
                  value={item?.symbol}
                  label={item?.name}
                  on:click={() => handleAddTicker(item?.symbol)}
                >
                  <div class="flex flex-col items-start">
                    <span class="text-xs text-gray-700 dark:text-zinc-200"
                      >{item?.symbol}</span
                    >
                    <span class="text-[10px] text-gray-500 dark:text-zinc-400"
                      >{item?.name}</span
                    >
                  </div>
                </Combobox.Item>
              {:else}
                <span
                  class="block px-3 py-2 text-xs text-gray-500 dark:text-zinc-400"
                >
                  No results found
                </span>
              {/each}
            {:else}
              <Combobox.Item
                class="cursor-pointer flex h-fit w-auto select-none items-center rounded-button py-1.5 pl-3 pr-1.5 text-xs capitalize outline-hidden"
              >
                <span class="text-xs text-gray-500 dark:text-zinc-400">
                  No results found
                </span>
              </Combobox.Item>
            {/if}
          </Combobox.Content>
        </Combobox.Root>
      </div>

      <!-- Edit/Delete buttons -->
      {#if watchlistItems.length > 0}
        <div class="flex items-center gap-1 flex-shrink-0">
          {#if editMode}
            <label
              on:click={handleDeleteTickers}
              class="border text-xs border-gray-300 dark:border-zinc-700 cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-full py-1 px-2 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-rose-800 dark:hover:text-rose-400"
            >
              <svg
                class="inline-block w-3.5 h-3.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M10 5h4a2 2 0 1 0-4 0M8.5 5a3.5 3.5 0 1 1 7 0h5.75a.75.75 0 0 1 0 1.5h-1.32l-1.17 12.111A3.75 3.75 0 0 1 15.026 22H8.974a3.75 3.75 0 0 1-3.733-3.389L4.07 6.5H2.75a.75.75 0 0 1 0-1.5zm2 4.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0zM14.25 9a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75m-7.516 9.467a2.25 2.25 0 0 0 2.24 2.033h6.052a2.25 2.25 0 0 0 2.24-2.033L18.424 6.5H5.576z"
                />
              </svg>
              <span class="ml-1 text-xs">{numberOfChecked}</span>
            </label>
          {/if}
          <label
            on:click={handleEditMode}
            class="border text-xs border-gray-300 dark:border-zinc-700 cursor-pointer inline-flex items-center justify-start space-x-1 whitespace-nowrap rounded-full py-1 px-2 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-800 dark:hover:text-violet-400"
          >
            <svg
              class="inline-block w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1024 1024"
            >
              <path
                fill="currentColor"
                d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"
              />
              <path
                fill="currentColor"
                d="m469.952 554.24l52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
              />
            </svg>
            <span class="ml-1 text-xs">
              {#if !editMode}
                Edit
              {:else}
                Cancel
              {/if}
            </span>
          </label>
        </div>
      {/if}
    </div>
  {/if}

  <div class="flex-1 overflow-y-auto">
    {#if activeTab === "alerts"}
      <div class="px-4 py-6 text-sm text-gray-500 dark:text-zinc-400">
        <div
          class="flex items-center gap-2 text-gray-700 dark:text-zinc-200 font-semibold"
        >
          Price alerts
        </div>
        <p class="mt-2 text-xs leading-relaxed">
          Alerts are coming soon. You will be able to set triggers directly from
          the chart and watchlist.
        </p>
        <button
          type="button"
          class="mt-4 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/70 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 cursor-not-allowed"
          disabled
        >
          Create alert
        </button>
      </div>
    {:else if isLoading}
      <div class="px-4 py-6 text-xs text-gray-500 dark:text-zinc-400">
        Loading watchlist...
      </div>
    {:else if errorMessage}
      <div class="px-4 py-6 text-sm text-rose-600 dark:text-rose-400">
        {errorMessage}
      </div>
    {:else if watchlistItems.length === 0}
      <div class="px-4 py-6 text-xs text-gray-500 dark:text-zinc-400">
        Add tickers to see them here.
      </div>
    {:else}
      <div
        class="px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500 dark:text-zinc-400 grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] gap-2"
      >
        <span>Symbol</span>
        <span class="text-right whitespace-nowrap">Price</span>
        <span class="text-right whitespace-nowrap">% Chg</span>
        <span class="text-right whitespace-nowrap">Vol</span>
      </div>

      <div class="pb-4">
        {#each groupedItems as group}
          <!-- Group Header (Collapsible) -->
          {#if group.label}
            <button
              type="button"
              class="w-full flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-wide text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition border-b border-gray-200/60 dark:border-zinc-800/70"
              on:click={() => toggleGroupCollapse(group.key)}
            >
              <ChevronRight
                class="size-3 transition-transform {collapsedGroups.has(
                  group.key,
                )
                  ? ''
                  : 'rotate-90'}"
              />
              <span>{group.label}</span>
              <span class="ml-auto text-[9px] text-gray-400 dark:text-zinc-600"
                >({group.items.length})</span
              >
            </button>
          {/if}

          <!-- Group Items -->
          {#if !collapsedGroups.has(group.key)}
            {#each group.items as item}
              {@const isActive = isActiveSymbol(item?.symbol)}
              {@const isSelected = deleteTickerList.includes(
                item?.symbol ?? "",
              )}
              <button
                type="button"
                class="cursor-pointer group w-full text-left grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] gap-1 px-3 py-1.5 text-[11px] transition relative border-b border-gray-200/40 dark:border-zinc-800/50 hover:bg-gray-50/80 dark:hover:bg-[#14161a] text-gray-700 dark:text-zinc-200"
                title={item?.name ?? item?.symbol}
                on:click={() => {
                  if (editMode) {
                    handleFilter(item?.symbol ?? "");
                  } else {
                    navigateToSymbol(item?.symbol);
                  }
                }}
              >
                <!-- Symbol with Logo and Status Dot (or Checkbox in edit mode) -->
                <span class="flex items-center gap-1.5 truncate">
                  {#if editMode}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      on:click|stopPropagation={() =>
                        handleFilter(item?.symbol ?? "")}
                      class="size-3.5 rounded border-gray-300 dark:border-zinc-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  {:else}
                    <img
                      src={getLogoUrl(item?.symbol)}
                      alt=""
                      class="size-4 rounded-full object-cover flex-shrink-0"
                      style="clip-path: circle(50%);"
                      loading="lazy"
                      on:error={(e) => {
                        const target = e.target;
                        if (target instanceof HTMLImageElement) {
                          target.style.display = "none";
                        }
                      }}
                    />
                  {/if}
                  <span
                    class=" truncate sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                    >{item?.symbol ?? "-"}</span
                  >
                </span>

                <!-- Price -->
                <span
                  class="text-right tabular-nums transition-colors duration-300 {item?.previous != null
                    ? toNumber(item?.price) > item.previous
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : toNumber(item?.price) < item.previous
                        ? 'text-rose-600 dark:text-rose-400'
                        : ''
                    : ''}"
                  >{formatPrice(item?.price)}</span
                >

                <!-- Change % -->
                <span
                  class="text-right tabular-nums transition-colors duration-300 {item?.previous != null
                    ? toNumber(item?.price) > item.previous
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : toNumber(item?.price) < item.previous
                        ? 'text-rose-600 dark:text-rose-400'
                        : getChangeClass(toNumber(item?.changesPercentage))
                    : getChangeClass(toNumber(item?.changesPercentage))}"
                >
                  {formatPercent(toNumber(item?.changesPercentage))}
                </span>

                <!-- Volume -->
                <span
                  class="text-right tabular-nums text-gray-500 dark:text-zinc-400"
                >
                  {formatVolume(item?.volume)}
                </span>
              </button>
            {/each}
          {/if}
        {/each}
      </div>

      <!-- Pagination Controls -->
      {#if totalPages > 1}
        <div
          class="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-[#0b0b0d] sticky bottom-0"
        >
          <!-- Previous button -->
          <button
            type="button"
            on:click={prevPage}
            disabled={currentPage === 1}
            class="p-1 rounded transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <!-- Page info -->
          <span class="text-[10px] text-gray-500 dark:text-zinc-400">
            {currentPage} / {totalPages}
          </span>

          <!-- Next button -->
          <button
            type="button"
            on:click={nextPage}
            disabled={currentPage === totalPages}
            class="p-1 rounded transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Create Watchlist Modal -->
<input
  type="checkbox"
  id="createWatchlistModal"
  class="modal-toggle"
  bind:checked={isCreateModalOpen}
/>

<dialog id="createWatchlistModal" class="modal modal-bottom sm:modal-middle">
  <label for="createWatchlistModal" class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box w-full relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="createWatchlistModal"
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        />
      </svg>
    </label>

    <div class="mb-5">
      <h3 class="font-bold text-2xl mb-5">New Watchlist</h3>

      <form on:submit={handleCreateWatchlist} class="space-y-2 w-full m-auto">
        <div
          class="form-control w-full max-w-2xl mb-2 text-gray-700 dark:text-white"
        >
          <label for="watchlistTitle" class="label pb-1">
            <span class="text-gray-700 dark:text-white">List Name</span>
          </label>
          <div class="relative">
            <input
              id="watchlistTitle"
              type="text"
              name="title"
              bind:value={newWatchlistTitle}
              class="input input-lg input-bordered border border-gray-300/80 dark:border-zinc-700/80 focus:outline-none focus:border-gray-400/90 dark:focus:border-zinc-500/90 w-full bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 rounded-full whitespace-normal"
              required
              autocomplete="off"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isCreatingWatchlist}
          class="cursor-pointer mt-2 py-3 w-full rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold text-md transition hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-60"
        >
          {isCreatingWatchlist ? "Creating..." : "Create Watchlist"}
        </button>
      </form>
    </div>
  </div>
</dialog>

<!-- Delete Watchlist Modal -->
<input
  type="checkbox"
  id="deleteWatchlistModal"
  class="modal-toggle"
  bind:checked={isDeleteModalOpen}
/>

<dialog id="deleteWatchlistModal" class="modal modal-middle p-3 sm:p-0">
  <label for="deleteWatchlistModal" class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box w-full p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="deleteWatchlistModal"
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        />
      </svg>
    </label>

    <h3 class="text-lg font-medium mb-2">Delete Watchlist</h3>
    <p class="text-sm mb-6">
      Are you sure you want to delete "{watchlistToDelete?.title ??
        "this watchlist"}"? This action cannot be undone.
    </p>

    <div class="flex justify-end space-x-3">
      <label
        for="deleteWatchlistModal"
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 hover:text-violet-800 dark:hover:text-violet-400"
        tabindex="0"
      >
        Cancel
      </label>
      <button
        type="button"
        on:click={handleDeleteWatchlist}
        disabled={isDeletingWatchlist}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 flex items-center border border-rose-200/70 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 disabled:opacity-60"
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
          <polyline points="3 6 5 6 21 6"></polyline>
          <path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          ></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
        {isDeletingWatchlist ? "Deleting..." : "Delete"}
      </button>
    </div>
  </div>
</dialog>
